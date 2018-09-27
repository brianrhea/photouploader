/*jshint esversion: 6 */

inp.onchange = e => {
  for (let i = 0; i < inp.files.length; i++) {
    toThumbnail(inp.files[i])
      .then(img => createThumbnail(img))
      .catch(console.error);
  }
};

function createThumbnail(img) {
  var col = document.createElement('div');
  col.classList = "col-3";

  var thumbnail = document.createElement('div');
  thumbnail.classList = "thumbnail position-relative";

  var thumbnailOverlay = document.createElement('div');
  thumbnailOverlay.classList = "thumbnail-overlay py-1 px-3 d-flex justify-content-between position-absolute";

  const icons = "<i class='material-icons rotate-btn'>rotate_right</i><i class='material-icons cover-btn'>image</i><i class='material-icons must-see-btn'>flash_on</i>";

  $(thumbnailOverlay).append(icons);

  col.appendChild(thumbnail);
  thumbnail.appendChild(thumbnailOverlay);
  thumbnail.appendChild(img);

  $('.gallery').append(col);
}

function toThumbnail(file) {
  return loadImage(file)
    .then(drawToCanvas)
    .catch(_ => {});
}

function loadImage(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  return new Promise((res, rej) => {
    img.onload = e => res(img);
    img.onerror = rej;
    img.src = url;
    img.fileName = file.name;
  });
}

function drawToCanvas(img) {
  const w = Math.min(img.naturalWidth, 210);
  const r = w / img.naturalWidth;
  const h = img.naturalHeight * r;
  const canvas = Object.assign(
    document.createElement('canvas'), {
      width: w,
      height: h
    }
  );
  canvas.setAttribute('data-fileName', img.fileName);
  canvas.setAttribute('data-rotation', "0");
  canvas.setAttribute('data-mustSee', false);
  canvas.setAttribute('data-cover', false);
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return canvas;
}

const processImages = {};

function collectImageData() {
  $('canvas').each(function(index, el){
    var filename = $(el).data('filename');
    processImages[filename] = {
      "cover": $(el).data('cover'),
      "rotation": $(el).data('rotation'),
      "mustSee": $(el).data('mustSee'),
    };
  });

  console.log(processImages);

}

$('#upload').on('click', function(){
  collectImageData();
});

$(function () {
  var gallery = $('.gallery');

  /////////////////////////////////////////////////
  // HANDLE ROTATION
  /////////////////////////////////////////////////
  gallery.on('click', '.rotate-btn', function (event) {
    var canvas = $(event.target)
      .closest('.thumbnail')
      .find('canvas');

    var rotation = +canvas.attr('data-rotation');
    if (rotation < 260) {
      rotation += 90;
    } else {
      rotation = 0;
    }

    // update preview
    var rotateValue = 'rotate(' + rotation + 'deg)';
    canvas.css({
      '-webkit-transform': rotateValue,
      '-moz-transform': rotateValue,
      '-o-transform': rotateValue,
      '-ms-transform': rotateValue,
      'transform': rotateValue
    });

    // update metadata
    canvas.attr('data-rotation', rotation);
  });

  /////////////////////////////////////////////////
  // HANDLE COVER
  /////////////////////////////////////////////////
  gallery.on('click', '.cover-btn', function (event) {
    var canvas = $(event.target)
      .closest('.thumbnail')
      .find('canvas');

    var cover = (canvas.attr('data-cover') === 'true');

    if (!cover) {
      // since cover must be only one
      // find current cover (if exist) and disable it
      var currentCover = $('.cover-btn.highlighted');
      if (currentCover.length) {
        currentCover.removeClass('highlighted');
        currentCover
          .closest('.thumbnail')
          .find('canvas')
          .attr('data-cover', false);
      }
    }

    // toggle value
    cover = !cover;

    // update preview
    event.target.classList.toggle('highlighted', cover);

    // update metadata
    canvas.attr('data-cover', cover);
  });

  /////////////////////////////////////////////////
  // HANDLE MUST-SEE
  /////////////////////////////////////////////////
  gallery.on('click', '.must-see-btn', function (event) {
    var canvas = $(event.target)
      .closest('.thumbnail')
      .find('canvas');

    var mustSee = (canvas.attr('data-mustSee') === 'true');

    // toggle value
    mustSee = !mustSee;

    // update preview
    event.target.classList.toggle('highlighted', mustSee);

    // update metadata
    canvas.attr('data-mustSee', mustSee);
  });
});