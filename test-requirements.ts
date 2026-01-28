import { PrismaClient } from '@prisma/client'

async function test() {
    const baseUrl = 'http://localhost:3000'
    process.env.TEST_MODE = '1'

    console.log('--- Testing Health Check ---')
    const health = await fetch(`${baseUrl}/api/healthz`)
    console.log('Health:', await health.json())

    console.log('\n--- Testing Paste Creation ---')
    const createRes = await fetch(`${baseUrl}/api/pastes`, {
        method: 'POST',
        body: JSON.stringify({
            content: 'Hello World',
            ttl_seconds: 60,
            max_views: 2
        }),
        headers: { 'Content-Type': 'application/json' }
    })
    const paste = await createRes.json()
    console.log('Created:', paste)

    console.log('\n--- Testing Paste Retrieval 1 (View 1) ---')
    const get1 = await fetch(`${baseUrl}/api/pastes/${paste.id}`)
    console.log('View 1 Status:', get1.status)
    console.log('View 1 Body:', await get1.json())

    console.log('\n--- Testing Paste Retrieval 2 (View 2) ---')
    const get2 = await fetch(`${baseUrl}/api/pastes/${paste.id}`)
    console.log('View 2 Status:', get2.status)

    console.log('\n--- Testing Paste Retrieval 3 (View 3 - should fail) ---')
    const get3 = await fetch(`${baseUrl}/api/pastes/${paste.id}`)
    console.log('View 3 Status (Expected 404):', get3.status)

    console.log('\n--- Testing Expiry with x-test-now-ms ---')
    const createExpiryRes = await fetch(`${baseUrl}/api/pastes`, {
        method: 'POST',
        body: JSON.stringify({
            content: 'Expiring soon',
            ttl_seconds: 10
        }),
        headers: { 'Content-Type': 'application/json' }
    })
    const pasteExp = await createExpiryRes.json()

    const futureTime = Date.now() + 20000
    const getExp = await fetch(`${baseUrl}/api/pastes/${pasteExp.id}`, {
        headers: { 'x-test-now-ms': futureTime.toString() }
    })
    console.log('Expired Status (Expected 404):', getExp.status)

    console.log('\n--- All Tests Finished ---')
    process.exit(0)
}

test().catch(console.error)
