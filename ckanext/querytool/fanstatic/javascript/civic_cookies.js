ckan.module('civic_cookies', function (jQuery) {
    return {
      initialize: function () {

        ckan_sandbox = this.sandbox;

        console.log(this.options)
        
        var config = {
            apiKey: this.options.api_key,
            product: this.options.license_type,
            position: this.options.popup_position,
            theme: this.options.theme_color,
            initialState: this.options.initial_state,
            //  TODO: check for others, maybe
            necessaryCookies: ['auth_tkt'],
            encodeCookie: true,
            notifyOnce: true,
            rejectButton: true,
            text: {
              title: 'This site uses cookies.',
              intro: 'Some of these cookies are essential, while others help us to improve your experience by providing insights into how the site is being used. \n \n For more information on the cookies we use, please check our Cookies Page.',
              necessaryTitle: 'Necessary cookies',
              necessaryDescription: 'Necessary cookies enable core functionality such as security, network management, and accessibility. You may disable these by changing your browser settings, but this may affect how the website functions.',
            },
            accessibility:{
              accessKey: '',
              highlightFocus: true
            },
            optionalCookies: [
              {
                  name : 'analytics',
                  label: 'Analytical Cookies',
                  description: "Analytics cookies help us to improve our website by collecting and reporting information on how you use it. The cookies collect information in a way that does not directly identify anyone.",
                  cookies: ['_ga', '_gid', '_gat', '__utma', '__utmt', '__utmb', '__utmc', '__utmz', '__utmv'],
                  onAccept : function(){
                    ckan_sandbox.publish('analytics_enabled', true);
                  },
                  onRevoke: function(){
                    ckan_sandbox.publish('analytics_enabled', false);
                  }
              },
            ]
        };
          
        CookieControl.load( config );
      }
    };
});
