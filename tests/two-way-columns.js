// It requires "Detailed Mortality by Cause" application (see staging)

const TIMEOUT = 10000
const ELEMENTS = {
  simpleTableHeaders: '.table:nth-child(3) thead',
  categoryTableHeaders: '.table:nth-child(10) thead',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] Test jumping to the related app':
    (client) => {
      client
        .url(`${client.launch_url}/querytool/public/detailed-mortality-by-cause`)
        // Dimension: sexo, measure: taxa
        .waitForElementVisible(ELEMENTS.simpleTableHeaders, TIMEOUT)
        .assert.containsText(ELEMENTS.simpleTableHeaders, 'Sexo')
        .assert.containsText(ELEMENTS.simpleTableHeaders, 'Taxa de mortalidade')
        // Dimension: unidate, measure: taxa, category: sexo
        .waitForElementVisible(ELEMENTS.categoryTableHeaders, TIMEOUT)
        .assert.containsText(ELEMENTS.categoryTableHeaders, 'Unidade de federação')
        .assert.containsText(ELEMENTS.categoryTableHeaders, 'Taxa de mortalidade')
        .assert.containsText(ELEMENTS.categoryTableHeaders, 'Ambos')
        .assert.containsText(ELEMENTS.categoryTableHeaders, 'Feminino')
        .assert.containsText(ELEMENTS.categoryTableHeaders, 'Masculino')
        .end();
    },

};
