ckan.module("civic_cookies", function ($) {
  return {
    initialize: function () {
      ckan_sandbox = this.sandbox;
      
      if (this.options.api_key && this.options.enabled) {

        //  To make sure the type of the config
        //  is string, otherwise return empty
        const optionToString = (field) => {
          return typeof field === 'string' ? field : '';
        }

        this.options.license_type = optionToString(this.options.license_type) || 'COMMUNITY';
        this.options.popup_position = optionToString(this.options.popup_position) || 'RIGHT';
        this.options.theme_color = optionToString(this.options.theme_color) || 'DARK';
        this.options.initial_state = optionToString(this.options.initial_state) || 'OPEN';

        const text = this.options.text;
        //  Removing extra double quotes that come from
        //  the JSON encoding/decoding process
        for(let key in text) {
          text[key] = text[key].replace(new RegExp('\\"', 'g'), '');
        }

        var config = {
          apiKey: this.options.api_key,
          product: this.options.license_type,
          position: this.options.popup_position,
          theme: this.options.theme_color,
          initialState: this.options.initial_state,
          necessaryCookies: ["auth_tkt"],
          encodeCookie: true,
          notifyOnce: true,
          rejectButton: true,
          text: {
            title: text.title || this._("This site uses cookies."),
            intro: text.intro ||
              this._("Some of these cookies are essential, while others help us to improve your experience by providing insights into how the site is being used."),
            necessaryTitle: text.necessary_title || this._("Necessary cookies"),
            accept: text.accept || this._("I Accept Cookies"),
            acceptSettings: text.accept || this._("I Accept Cookies"),
            reject: text.reject || this._("I Do Not Accept Cookies"), 
            rejectSettings: text.reject || this._("I Do Not Accept Cookies"), 
            necessaryDescription: text.necessary_description ||
              this._("Necessary cookies enable core functionality such as security, network management, and accessibility. You may disable these by changing your browser settings, but this may affect how the website functions."),
            on: text.on || this._("On"),
            off: text.off || this._("Off"),
          
          },
          accessibility: {
            accessKey: "",
            highlightFocus: true,
          },
          optionalCookies: [
            {
              name: "analytics",
              label: text.analytical_title || this._("Analytical Cookies"),
              description: text.analytical_description || 
                this._("Analytics cookies help us to improve our website by collecting and reporting information on how you use it. The cookies collect information in a way that does not directly identify anyone."),
              cookies: [
                "_ga",
                "_gid",
                "_gat",
                "__utma",
                "__utmt",
                "__utmb",
                "__utmc",
                "__utmz",
                "__utmv",
              ],
              onAccept: function () {
                ckan_sandbox.publish("analytics_enabled", true);
              },
              onRevoke: function () {
                ckan_sandbox.publish("analytics_enabled", false);
              },
            },
          ],
        };

        CookieControl.load(config);
      }
    },
  };
});
