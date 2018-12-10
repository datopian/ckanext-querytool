// It requires "Detailed Mortality by Cause" application (see staging)

const ELEMENTS = {
  nextButton: '.paginate_button.next',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] Tables should be in english by default':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        // Check next button
        .waitForElementVisible(ELEMENTS.nextButton, 10000)
        .assert.containsText(ELEMENTS.nextButton, 'Next')
        .end();
    },

  '[en] Tables should be in english using `en` locale':
    (client) => {
      client
        .url(`${client.launch_url}/en/querytool/public/detailed-mortality-by-cause`)
        // Check next button
        .waitForElementVisible(ELEMENTS.nextButton, 10000)
        .assert.containsText(ELEMENTS.nextButton, 'Next')
        .end();
    },

  '[es] Tables should be in spanish using `es` locale':
    (client) => {
      client
        .url(`${client.launch_url}/es/querytool/public/detailed-mortality-by-cause`)
        // Check next button
        .waitForElementVisible(ELEMENTS.nextButton, 10000)
        .assert.containsText(ELEMENTS.nextButton, 'Siguiente')
        .end();
    },

  '[fr] Tables should be in french using `fr` locale':
    (client) => {
      client
        .url(`${client.launch_url}/fr/querytool/public/detailed-mortality-by-cause`)
        // Check next button
        .waitForElementVisible(ELEMENTS.nextButton, 10000)
        .assert.containsText(ELEMENTS.nextButton, 'Suivant')
        .end();
    },

  '[pt_BR] Tables should be in portuguese using `pt_BR` locale':
    (client) => {
      client
        .url(`${client.launch_url}/pt_BR/querytool/public/detailed-mortality-by-cause`)
        // Check next button
        .waitForElementVisible(ELEMENTS.nextButton, 10000)
        .assert.containsText(ELEMENTS.nextButton, 'Próximo')
        .end();
    },

  '[zh_CN] Tables should be in chinese using `zh_CN` locale':
    (client) => {
      client
        .url(`${client.launch_url}/zh_CN/querytool/public/detailed-mortality-by-cause`)
        // Check next button
        .waitForElementVisible(ELEMENTS.nextButton, 10000)
        .assert.containsText(ELEMENTS.nextButton, '下页')
        .end();
    },

};
