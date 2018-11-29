// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  labelTooltipName: '.control-label[for="chart_field_tooltip_name_1"]',
  labelYAxisTicksCount: '.control-label[for="chart_field_tick_count_1"]',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] "Tooltip name" and "Y asix tick count" shouldn\'t be visible':
    (client) => {
      client
        // Login and open config
        .url(`${client.launch_url}/user/login`)
        .waitForElementVisible('body', TIMEOUT)
        .setValue('input#field-login', 'ckan_admin')
        .setValue('input#field-password', 'test1234')
        .click('button.btn-primary[type=submit]')
        .pause(TIMEOUT/10)
        // Check hidden elements
        .url(`${client.launch_url}/querytool/edit_visualizations/detailed-mortality-by-cause`)
        .waitForElementVisible('body', TIMEOUT)
        .assert.hidden(ELEMENTS.labelTooltipName)
        .assert.hidden(ELEMENTS.labelYAxisTicksCount)
        .end()
    },

};
