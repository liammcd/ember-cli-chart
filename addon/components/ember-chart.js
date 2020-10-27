/* global Chart */
import Component from "@ember/component";

export default Component.extend({
  tagName: "canvas",
  attributeBindings: ["width", "height"],

  init() {
    this._super(...arguments);

    this.plugins = this.plugins || [];

    Chart.helpers.merge(Chart.defaults.global, {
      datasets: {
        roundedBar: {
          categoryPercentage: 0.8,
          barPercentage: 0.9
        }
      }
    });

    Chart.helpers.drawRoundedTopRectangle = function(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      // top right corner
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      // bottom right   corner
      ctx.lineTo(x + width, y + height);
      // bottom left corner
      ctx.lineTo(x, y + height);
      // top left
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

  	Chart.elements.RoundedTopRectangle = Chart.elements.Rectangle.extend({
  	  draw: function() {
  	    var ctx = this._chart.ctx;
  	    var vm = this._view;
  	    var left, right, top, bottom, signX, signY, borderSkipped;
  	    var borderWidth = vm.borderWidth;

  	    if (!vm.horizontal) {
  	      // bar
  	      left = vm.x - vm.width / 2;
  	      right = vm.x + vm.width / 2;
  	      top = vm.y;
  	      bottom = vm.base;
  	      signX = 1;
  	      signY = bottom > top? 1: -1;
  	      borderSkipped = vm.borderSkipped || 'bottom';
  	    } else {
  	      // horizontal bar
  	      left = vm.base;
  	      right = vm.x;
  	      top = vm.y - vm.height / 2;
  	      bottom = vm.y + vm.height / 2;
  	      signX = right > left? 1: -1;
  	      signY = 1;
  	      borderSkipped = vm.borderSkipped || 'left';
  	    }

  	    // Canvas doesn't allow us to stroke inside the width so we can
  	    // adjust the sizes to fit if we're setting a stroke on the line
  	    if (borderWidth) {
  	      // borderWidth shold be less than bar width and bar height.
  	      var barSize = Math.min(Math.abs(left - right), Math.abs(top - bottom));
  	      borderWidth = borderWidth > barSize? barSize: borderWidth;
  	      var halfStroke = borderWidth / 2;
  	      // Adjust borderWidth when bar top position is near vm.base(zero).
  	      var borderLeft = left + (borderSkipped !== 'left'? halfStroke * signX: 0);
  	      var borderRight = right + (borderSkipped !== 'right'? -halfStroke * signX: 0);
  	      var borderTop = top + (borderSkipped !== 'top'? halfStroke * signY: 0);
  	      var borderBottom = bottom + (borderSkipped !== 'bottom'? -halfStroke * signY: 0);
  	      // not become a vertical line?
  	      if (borderLeft !== borderRight) {
  	        top = borderTop;
  	        bottom = borderBottom;
  	      }
  	      // not become a horizontal line?
  	      if (borderTop !== borderBottom) {
  	        left = borderLeft;
  	        right = borderRight;
  	      }
  	    }

  	    // calculate the bar width and roundess
  	    var barWidth = Math.abs(left - right);
  	    var roundness = this._chart.config.options.barRoundness || 0.5;
  	    var radius = barWidth * roundness * 0.5;

  	    // keep track of the original top of the bar
  	    var prevTop = top;

  	    // move the top down so there is room to draw the rounded top
  	    top = prevTop + radius;
  	    var barRadius = top - prevTop;

  	    ctx.beginPath();
  	    ctx.fillStyle = vm.backgroundColor;
  	    ctx.strokeStyle = vm.borderColor;
  	    ctx.lineWidth = borderWidth;

  	    // draw the rounded top rectangle
  	    Chart.helpers.drawRoundedTopRectangle(ctx, left, (top - barRadius + 1), barWidth, bottom - prevTop, barRadius);

  	    ctx.fill();
  	    if (borderWidth) {
  	      ctx.stroke();
  	    }
  	    // restore the original top value so tooltips and scales still work
  	    top = prevTop;
  	  },
  	});
  	Chart.defaults.roundedBar = Chart.helpers.clone(Chart.defaults.bar);

  	Chart.controllers.roundedBar = Chart.controllers.bar.extend({
  	  dataElementType: Chart.elements.RoundedTopRectangle
  	});
  },

  didInsertElement() {
    this._super(...arguments);

    let context = this.element;
    let data = this.data;
    let type = this.type;
    let options = this.options;
    let plugins = this.plugins;

    let chart = new Chart(context, {
      type: type,
      data: data,
      options: options,
      plugins: plugins
    });

    this.set("chart", chart);
  },

  willDestroyElement() {
    this._super(...arguments);
    this.chart.destroy();
  },

  didUpdateAttrs() {
    this._super(...arguments);
    this.updateChart();
  },

  updateChart() {
    let chart = this.chart;
    let data = this.data;
    let options = this.options;
    let animate = this.animate;

    if (chart) {
      chart.data = data;
      chart.options = options;
      if (animate) {
        chart.update();
      } else {
        chart.update(0);
      }

      if (this.customLegendElement) {
        this.customLegendElement.innerHTML = chart.generateLegend();
      }
    }
  }
});
