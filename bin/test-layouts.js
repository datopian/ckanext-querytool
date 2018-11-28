// It's a script to use in the browser terminal

// Provided layouts
LAYOUTS = {
  page1: [
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'long small rectangle',
    'small square',
    'small square',
    'small square',
    'horizontal double small square',
    'small square',
  ],
  page2: [
    'large rectangle',
    'large rectangle',
    'extra large rectangle',
    'large square',
    'small square',
    'small square',
  ],
  page3: [
    'vertical double small square',
    'vertical double small square',
    'small square',
    'small square',
    'large vertical',
    'large vertical',
  ],
  page5: [
    'small square',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small square',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'large rectangle',
    'small rectangle',
    'small rectangle',
    'large rectangle',
    'small square',
  ],
  page6: [
    'horizontal double small square',
    'small rectangle',
    'small rectangle',
    'large square',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
  ],
  page7: [
    'large square',
    'small rectangle',
    'small rectangle',
    'small square',
    'large square',
    'small square',
    'small rectangle',
    'small rectangle',
  ],
  page8: [
    'large square',
    'small rectangle',
    'small square',
    'small rectangle',
    'vertical double small square',
    'vertical double small square',
    'small rectangle',
    'small square',
    'small rectangle',
  ],
  page9: [
    'vertical double small square',
    'vertical double small square',
    'small rectangle',
    'small rectangle',
    'small square',
    'vertical double small square',
    'vertical double small square',
    'small square',
    'small rectangle',
    'small rectangle',
  ],
  page10: [
    'vertical double small square',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'vertical double small square',
    'small square',
    'small square',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
  ],
  page11: [
    'vertical double small square',
    'small square',
    'small rectangle',
    'small rectangle',
    'small square',
    'small rectangle',
    'small rectangle',
    'vertical double small square',
    'small square',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
  ],
  page12: [
    'vertical double small square',
    'small square',
    'small square',
    'small square',
    'small square',
    'vertical double small square',
    'small square',
    'small square',
    'small square',
    'small rectangle',
    'small rectangle',
  ],
  page13: [
    'large vertical',
    'large rectangle',
    'large rectangle',
    'large vertical',
    'small square',
    'small square',
  ],
  page14: [
    'large vertical',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'small rectangle',
    'large vertical',
    'small square',
    'small rectangle',
    'small rectangle',
  ],
  page15: [
    'large vertical',
    'small rectangle',
    'small square',
    'small rectangle',
    'large vertical',
    'small rectangle',
    'small rectangle',
    'small square',
  ],
  page16: [
    'large vertical',
    'large rectangle',
    'small square',
    'large vertical',
    'small square',
    'large rectangle',
  ],
  page17: [
    'large vertical',
    'large rectangle',
    'small rectangle',
    'small rectangle',
  ],
}

// Element sizes mapping
SIZES = {
  'small rectangle': 'size-sm',
  'long small rectangle': 'size-sm wide',
  'small square': 'size-sm square',
  'horizontal double small square': 'size-sm double square',
  'large rectangle': 'size-lg',
  'extra large rectangle': 'size-xl',
  'large square': 'size-lg square',
  'vertical double small square': 'size-sm vertical',
  'large vertical': 'size-lg vertical',
}

// Test layouts
index = 0
console.log(`Started testing`)
interval = setInterval(function () {
  page = Object.keys(LAYOUTS)[index]
  index += 1
  if (!page) {
    clearInterval(interval)
    console.log(`Finished testing`)
    return
  }
  selector = '.visualizations > .item'
  $(selector).parent().append($(selector).parent().html())
  $(selector).parent().append($(selector).parent().html())
  $(selector).each(function (index) {
    if (!LAYOUTS[page][index]) {
      $(this).remove()
      return
    }
    $(this).removeClass('size-sm size-md size-lg size-xl double square wide vertical')
    $(this).addClass(SIZES[LAYOUTS[page][index]])
  })
  $('h1').text(page.toUpperCase())
  $('#download-as-image').click()
  console.log(`Tested: ${page}`)
}, 10000)
