async function doesNotWork(fn, expected) {
  try {
    await fn
  } catch (error) {
    const vmException = error.message.search(expected) >= 0
    assert(vmException, "Expected throw, got '" + error + "' instead")
    return
  }
  assert.fail('Expected throw not received')
}

module.exports = doesNotWork
