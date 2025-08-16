// Basic runtime tests
const test = async () => {
  const baseUrl = "http://localhost:4123"

  console.log("🧪 Testing LogLineBrowser Runtime...")

  try {
    // Test 1: Create run
    const runResponse = await fetch(`${baseUrl}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: [{ tool: "web.fetch", args: { url: "https://example.com" } }],
        mode: "simulate",
      }),
    })

    const { run } = await runResponse.json()
    console.log("✅ Run created:", run.id)

    // Test 2: Get timeline
    const timelineResponse = await fetch(`${baseUrl}/timeline`)
    const { spans } = await timelineResponse.json()
    console.log("✅ Timeline loaded:", spans.length, "spans")

    // Test 3: Preview contract
    const contractResponse = await fetch(`${baseUrl}/contracts/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: [{ tool: "web.fetch", args: { url: "test" } }],
        risk: "low",
        est_cost: 0.01,
        est_time_sec: 5,
      }),
    })

    const { contract } = await contractResponse.json()
    console.log("✅ Contract created:", contract.id)

    console.log("🎉 All tests passed!")
  } catch (error) {
    console.error("❌ Test failed:", error.message)
  }
}

// Run if called directly
if (require.main === module) {
  test()
}

module.exports = { test }
