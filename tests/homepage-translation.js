// It requires `make i18n` run before

const ELEMENTS = {
  step1: '.how-to-use li:first-child',
}

module.exports = {
  afterEach: (client, done) => client.globals.report(client, done),

  '[default] Homepage should be in english by default':
    (client) => {
      client
        .url(`${client.launch_url}`)
        // Check next button
        .waitForElementVisible(ELEMENTS.step1, 10000)
        .assert.containsText(ELEMENTS.step1, 'Prepare data Before uploading the data into the Platform, it needs to be cleaned, validated and, depending on its source, transformed into a tabular dataset.')
        .end();
    },

  '[en] Homepage should be in english using `en` locale':
    (client) => {
      client
        .url(`${client.launch_url}/en/`)
        // Check next button
        .waitForElementVisible(ELEMENTS.step1, 10000)
        .assert.containsText(ELEMENTS.step1, 'Prepare data Before uploading the data into the Platform, it needs to be cleaned, validated and, depending on its source, transformed into a tabular dataset.')
        .end();
    },

  '[es] Homepage should be in spanish using `es` locale':
    (client) => {
      client
        .url(`${client.launch_url}/es/`)
        // Check next button
        .waitForElementVisible(ELEMENTS.step1, 10000)
        .assert.containsText(ELEMENTS.step1, 'Preparar datos. Antes de cargar los datos en la Plataforma, es necesario limpiarlos, validarlos y, según su fuente, transformarlos en un conjunto de datos tabulares.')
        .end();
    },

  '[fr] Homepage should be in spanish using `fr` locale':
    (client) => {
      client
        .url(`${client.launch_url}/fr/`)
        // Check next button
        .waitForElementVisible(ELEMENTS.step1, 10000)
        .assert.containsText(ELEMENTS.step1, 'Préparer la date. Avant de télécharger les données dans la plate-forme, elles doivent être nettoyées, validées et, selon leur source, transformées en un jeu de données tabulaire.')
        .end();
    },

  '[pt_BR] Homepage should be in portuguese using `pt_BR` locale':
    (client) => {
      client
        .url(`${client.launch_url}/pt_BR/`)
        // Check next button
        .waitForElementVisible(ELEMENTS.step1, 10000)
        .assert.containsText(ELEMENTS.step1, 'Preparar os dados. Antes de carregar os dados na Plataforma, ela precisa ser limpa, validada e, dependendo de sua origem, transformada em um conjunto de dados tabular.')
        .end();
    },

};
