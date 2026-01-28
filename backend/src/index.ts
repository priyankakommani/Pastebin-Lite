import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from './db'

export const app = new Hono()

// Helper to get present time (supports x-test-now-ms)
const getNow = (c: any) => {
    const testNow = c.req.header('x-test-now-ms')
    if (process.env.TEST_MODE === '1' && testNow) {
        return new Date(parseInt(testNow))
    }
    return new Date()
}

// Health check
app.get('/api/healthz', async (c) => {
    try {
        await prisma.$queryRaw`SELECT 1`
        return c.json({ ok: true })
    } catch (e) {
        return c.json({ ok: false }, 500)
    }
})

// Create a paste
app.post('/api/pastes', async (c) => {
    const body = await c.req.json()

    const schema = z.object({
        content: z.string().min(1),
        ttl_seconds: z.number().int().min(1).optional(),
        max_views: z.number().int().min(1).optional(),
    })

    const result = schema.safeParse(body)
    if (!result.success) {
        return c.json({ error: result.error }, 400)
    }

    const { content, ttl_seconds, max_views } = result.data
    const now = getNow(c)

    const expiresAt = ttl_seconds ? new Date(now.getTime() + ttl_seconds * 1000) : null

    const paste = await prisma.paste.create({
        data: {
            content,
            maxViews: max_views,
            remainingViews: max_views,
            expiresAt: expiresAt,
            createdAt: now,
        }
    })

    const protocol = c.req.header('x-forwarded-proto') || 'http'
    const host = c.req.header('host')
    const url = `${protocol}://${host}/p/${paste.id}`

    return c.json({
        id: paste.id,
        url: url
    }, 201)
})

// Fetch a paste (API)
app.get('/api/pastes/:id', async (c) => {
    const id = c.req.param('id')
    const now = getNow(c)

    const paste = await prisma.paste.findUnique({
        where: { id }
    })

    if (!paste) {
        return c.json({ error: 'Paste not found' }, 404)
    }

    // Check Expiry
    if (paste.expiresAt && paste.expiresAt < now) {
        return c.json({ error: 'Paste expired' }, 404)
    }

    // Check View Limit
    if (paste.maxViews !== null && (paste.remainingViews ?? 0) <= 0) {
        return c.json({ error: 'View limit exceeded' }, 404)
    }

    // Update view count
    const updatedPaste = await prisma.paste.update({
        where: { id },
        data: {
            remainingViews: paste.maxViews !== null ? { decrement: 1 } : undefined
        }
    })

    return c.json({
        content: updatedPaste.content,
        remaining_views: updatedPaste.remainingViews,
        expires_at: updatedPaste.expiresAt?.toISOString() || null
    })
})

// View a paste (HTML)
app.get('/p/:id', async (c) => {
    const id = c.req.param('id')
    const now = getNow(c)

    const paste = await prisma.paste.findUnique({
        where: { id }
    })

    if (!paste ||
        (paste.expiresAt && paste.expiresAt < now) ||
        (paste.maxViews !== null && (paste.remainingViews ?? 0) <= 0)) {
        return c.html('<h1>404 Paste Not Found</h1>', 404)
    }

    await prisma.paste.update({
        where: { id },
        data: {
            remainingViews: paste.maxViews !== null ? { decrement: 1 } : undefined
        }
    })

    // Safe rendering: Escape HTML
    const escapedContent = paste.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pastebin-Lite</title>
        <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 800px; margin: 0 auto; background: #f4f4f9; }
            pre { background: #fff; padding: 15px; border-radius: 8px; border: 1px solid #ddd; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
            .meta { font-size: 0.8em; color: #666; margin-top: 10px; }
        </style>
    </head>
    <body>
        <h1>Pastebin-Lite</h1>
        <pre>${escapedContent}</pre>
        <div class="meta">
            ${paste.expiresAt ? `Expires at: ${paste.expiresAt.toISOString()}` : 'No expiration'}
            ${paste.maxViews !== null ? ` | Remaining views: ${paste.remainingViews! - 1}` : ''}
        </div>
    </body>
    </html>
  `
    return c.html(html)
})

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    serve({
        fetch: app.fetch,
        port: 3000
    }, (info) => {
        console.log(`Server is running on http://localhost:${info.port}`)
    })
}
