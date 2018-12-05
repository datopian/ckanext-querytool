// It requires "Detailed Mortality by Cause" application (see staging)
// Add "Title from config" as a title to the Y-axis of the 4th viz

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default measure] Heading and chart titles should be correct':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        // Check heading
        .waitForElementVisible('h1', 10000)
        .assert.containsText('h1', 'Detailed Mortality by Cause')
        // Set by measure selection
        .waitForElementVisible('.chart:nth-child(1) .c3-axis-y-label', 10000)
        .assert.containsText('.chart:nth-child(1) .c3-axis-y-label', 'Taxa de mortalidade')
        // Set in the application config
        .waitForElementVisible('.chart:nth-child(4) .c3-axis-y-label', 10000)
        .assert.containsText('.chart:nth-child(4) .c3-axis-y-label', 'Title from config')
        .end();
    },

  '[custom measure] Heading and chart titles should be correct':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause?detailed-mortality-by-cause_y_axis_column=Percentagem`)
        // Check heading
        .waitForElementVisible('h1', 10000)
        .assert.containsText('h1', 'Detailed Mortality by Cause')
        // Set by measure selection
        .waitForElementVisible('.chart:nth-child(1) .c3-axis-y-label', 10000)
        .assert.containsText('.chart:nth-child(1) .c3-axis-y-label', 'Percentagem (alias)')
        // Set in the application config
        .waitForElementVisible('.chart:nth-child(4) .c3-axis-y-label', 10000)
        .assert.containsText('.chart:nth-child(4) .c3-axis-y-label', 'Title from config')
        .end();
    },

};
