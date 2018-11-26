module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[home page] H1 should be correct':
    (client) => {
      client
        .url(client.launch_url)
        .waitForElementVisible('body', 10000)
        .assert.containsText('h1', 'Portal Development Platform')
        .end();
    },

};
