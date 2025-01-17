'use strict';

function transitionColor (from, to, count) {
  count = count + 1;
  var int = parseInt(from, 16); // 100
  var intTo = parseInt(to, 16); // 50
  var list = []; // 5
  var diff = int - intTo; // 50
  var one = diff / count; // 10

  list.push(from);
  for (var i = 1; i <= count; i++) {
    list.push(Math.floor(int - (one * i)).toString(16));
  }

  return list
}

function transition (from, to, count) {
  count = count || 3;
  var r = from.slice(0, 2);
  var g = from.slice(2, 4);
  var b = from.slice(4, 6);
  var rt = to.slice(0, 2);
  var gt = to.slice(2, 4);
  var bt = to.slice(4, 6);
  var allR = transitionColor(r, rt, count);
  var allG = transitionColor(g, gt, count);
  var allB = transitionColor(b, bt, count);
  var list = [];

  allR.forEach(function (_, i) {
    list.push('' + allR[i] + allG[i] + allB[i]);
  });

  return list
}

function generateGradientStepsCss (from, to, count) {
  from = from.replace('#', '');
  to = to.replace('#', '');
  var values = transition(from, to, count);
  var total = 100 / (count + 1);
  var obj = [];
  for (var i = 0; i <= count + 1; i++) {
    obj.push({ percentage: Math.floor(total * i), value: values[i] });
  }
  return obj.map(function (value) {
    return '#' + value.value
  })
}

/**
 *  Calculate the coordinate
 * @param  {number[]|object[]}  arr
 * @param  {object}             boundary
 * @return {object[]}
 */
function genPoints (inArr, ref, ref$1) {
  var minX = ref.minX;
  var minY = ref.minY;
  var maxX = ref.maxX;
  var maxY = ref.maxY;
  var minBarHeight = ref.minBarHeight;
  var labelRotate = ref.labelRotate;
  var labelSize = ref.labelSize;
  var max = ref$1.max;
  var min = ref$1.min;

  var arr = inArr.map(function (item) { return (typeof item === 'number' ? item : item.value); });
  var minValue = Math.min.apply(Math, arr.concat( [min] ));
  var maxValue = Math.max.apply(Math, arr.concat( [max] ));
  var absMaxVal = Math.abs(maxValue);
  var absMinVal = Math.abs(minValue);
  var gridX = (maxX - minX) / (arr.length - 1);
  var labelHeight = 20;

  var delta = 0;
  if (minValue < 0 && maxValue < 0) {
    delta = absMinVal;
  } else if (minValue < 0 && maxValue >= 0) {
    delta = absMinVal + absMaxVal;
  } else if (minValue >= 0 && maxValue >= 0) {
    delta = maxValue;
  }

  var heightMultiplier = delta !== 0 ? (maxY - minY - labelHeight) / delta : 1;
  var yAdjust = minValue * heightMultiplier < minBarHeight ? minBarHeight : 0;
  var zeroLine = minValue < 0 ? absMinVal : 0;

  return arr.map(function (value, index) {
    var label = typeof inArr[index].title !== 'undefined' ? inArr[index].title : '';
    var title = typeof inArr[index].value === 'number' ? inArr[index].value : inArr[index];
    var height = Math.abs(value);
    var barHeight = (height * heightMultiplier - yAdjust > minBarHeight ? height * heightMultiplier - yAdjust : minBarHeight);
    return {
      x: index * gridX + minX,
      y: maxY - barHeight - (value >= 0 || value === 0 && minValue >= 0 ? zeroLine * heightMultiplier : zeroLine * heightMultiplier - barHeight) - labelHeight - yAdjust,
      height: barHeight,
      label: label,
      title: title
    }
  })
}

function genBars (_this, arr, h) {
  var ref = _this.boundary;
  var maxX = ref.maxX;
  var maxY = ref.maxY;
  var labelRotate = ref.labelRotate;
  var labelColor = ref.labelColor;
  var labelSize = ref.labelSize;
  var totalWidth = (maxX) / (arr.length - 1);
  if (!_this.barWidth) {
    _this.barWidth = totalWidth - (_this.padding || 5);
  }
  if (!_this.rounding) {
    _this.rounding = 2;
  }

  var gradients = 0;
  if (_this.gradient && _this.gradient.length > 1) {
    gradients = generateGradientStepsCss(_this.gradient[0], _this.gradient[1], (arr.length - 1));
  }
  var offsetX = (totalWidth - _this.barWidth) / 2;

  var rects = arr.map(function (item, index) {
    return h('rect', {
      attrs: {
        id: ("bar-id-" + index),
        fill: (gradients ? gradients[index] : (_this.gradient[0] ? _this.gradient[0] : '#000')),
        x: item.x - offsetX,
        y: item.y,
        width: _this.barWidth,
        height: item.height,
        rx: _this.rounding,
        ry: _this.rounding
      }
    }, [
      h('animate', {
        attrs: {
          attributeName: 'height',
          from: 0,
          to: item.height,
          dur: ((_this.growDuration) + "s"),
          fill: 'freeze'
        }
      }),
      h('title', {}, [item.title])
    ])
  });
  var translateOffsetX = labelRotate >= 0 ? 10 : -10;
  var xaxis = h(
    'g',
    {
      attrs: {
        class: 'x-axis',
        transform: ("translate(" + translateOffsetX + "," + (maxY - 8) + ")")
      }
    },
    arr.map(function (item, index) {
      var labelOffsetX = labelRotate < 0 ? item.x + offsetX : item.x - offsetX;
      return h(
        'g',
        {
          attrs: {
            class: 'v-bars--tick',
            transform: ("translate(" + labelOffsetX + ",0) rotate(" + labelRotate + ")")
          }
        },
        [
          h(
            'text',
            {
              attrs: {
                class: 'v-bars--label-text',
                style: ("text-anchor:middle; fill:" + labelColor + "; font-size: " + labelSize + "em;"),
                title: item.title
              }
            },
            [
              item.label
            ]
          )
        ]
      )
    })
  );
  return rects.concat(xaxis);
}

var Path = {
  props: ['data', 'boundary', 'barWidth', 'id', 'gradient', 'growDuration', 'max', 'min'],

  render: function render (h) {
    var ref = this;
    var data = ref.data;
    var boundary = ref.boundary;
    var max = ref.max;
    var min = ref.min;
    var points = genPoints(data, boundary, { max: max, min: min });
    var bars = genBars(this, points, h);

    return h(
      'g',
      {
        class: 'container',
        transform: ("translate(0," + (this.boundary.maxY) + ")")
      },
      bars
    )
  }
};

var Bars = {
  name: 'Bars',

  props: {
    data: {
      type: Array,
      required: true
    },
    autoDraw: Boolean,
    barWidth: {
      type: Number,
      default: 8
    },
    growDuration: {
      type: Number,
      default: 0.5
    },
    gradient: {
      type: Array,
      default: function () { return ['#000']; }
    },
    max: {
      type: Number,
      default: -Infinity
    },
    min: {
      type: Number,
      default: Infinity
    },
    minBarHeight: {
      type: Number,
      default: 3
    },
    labelRotate: {
      type: Number,
      default: 0
    },
    labelSize: {
      type: Number,
      default: 0.7
    },
    labelColor: {
      type: String,
      default: '#999999'
    },
    height: Number,
    width: Number,
    padding: {
      type: Number,
      default: 8
    }
  },

  render: function render (h) {
    if (!this.data || this.data.length < 2) { return }
    var ref = this;
    var width = ref.width;
    var height = ref.height;
    var padding = ref.padding;
    var viewWidth = width || 300;
    var viewHeight = height || 75;
    var boundary = {
      minX: padding,
      minY: padding,
      maxX: viewWidth - padding,
      maxY: viewHeight - padding,
      minBarHeight: this.minBarHeight,
      labelRotate: this.labelRotate,
      labelColor: this.labelColor,
      labelSize: this.labelSize
    };
    var props = this.$props;

    props.boundary = boundary;
    props.id = 'vue-bars-' + this._uid;

    return h('svg', {
      attrs: {
        width: width || '100%',
        height: height || '25%',
        viewBox: ("0 0 " + viewWidth + " " + viewHeight)
      }
    }, [
      h(Path, {
        props: props,
        ref: 'path'
      })
    ])
  }
};

Bars.install = function (Vue) {
  Vue.component(Bars.name, Bars);
};

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(Bars);
}

module.exports = Bars;
