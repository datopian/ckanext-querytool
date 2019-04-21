ckan.module('export-to-png', function($) {
    return {
        initialize: function(){
            var id = this.options.id;
            var chartType = this.options.type;
            this.el.click(function(e) {
                e.preventDefault();
                this.exportChartToPng(id, chartType);
            }.bind(this))
        },
        exportChartToPng: function(className, chartType){
            //fix weird back fill
            d3.select('.' + className).selectAll('path').attr('fill', 'none');
            //fix no axes
            d3.select('.' + className).selectAll('path.domain').attr('stroke', 'black');
            //fix no tick
            d3.select('.' + className).selectAll('.tick line').attr('stroke', 'black');
            //fix reference lines
            d3.select('.' + className).selectAll('.c3-ygrid-line.active').attr('display', 'none');
            //hide shapes outside y axis
            if (chartType === 'hbar' || chartType === 'shbar') {
              d3.select('.' + className).selectAll('path.c3-shape')[0].forEach(function(shape, index) {
                shape.pathSegList._list.forEach(function(item) {
                  item.x = item.x >= 0 ? item.x : 0;
                });
              });
            }
            var svgElement = $('.' + className).find('svg')[0];
            saveSvgAsPng(svgElement, className + '.png', {backgroundColor: 'white'});
        }
    }
})
