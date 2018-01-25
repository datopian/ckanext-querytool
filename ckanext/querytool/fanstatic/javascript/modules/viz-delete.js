ckan.module('querytool-viz-delete', function() {
    return {
        initialize: function() {
            this.el.click(function() {
                this.closest('.chart_field').remove();

                // Reorder the visualization items
                window.handleItemsOrder();
            });
        }
    }
})
