/*jshint esversion: 6 */

let selectedFiles = [];
let state = {};

inp.onchange = e => {
  let itemsPerPage = +$('#pagination-dropdown').val();
  let thumbnailsCount = $('.thumbnail').length;

  for (let i = 0; i < inp.files.length; i++) {
    inp.files[i].id = Math.random().toString(36).substring(7);

    // show thumbnail on this page
    // only if itemsPerPage is not exceeded
    if (thumbnailsCount < itemsPerPage) {
      toThumbnail(inp.files[i])
        .then(img => createThumbnail(img))
        .catch(console.error);
      thumbnailsCount++;
    }

    selectedFiles.push(inp.files[i])
  }

  updatePagination(selectedFiles, itemsPerPage);
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

  let id = img.getAttribute('data-id');
  if (state[id]) {
    if (state[id].rotation) {
      // update preview
      let rotateValue = 'rotate(' + state[id].rotation + 'deg)';
      $(img).css({
        '-webkit-transform': rotateValue,
        '-moz-transform': rotateValue,
        '-o-transform': rotateValue,
        '-ms-transform': rotateValue,
        'transform': rotateValue
      });

      // update metadata
      $(img).attr('data-rotation', state[id].rotation);

    }
    if (state[id].cover) {
      // update preview
      $(thumbnailOverlay).find('.cover-btn').toggleClass('highlighted', state[id].cover);
    }
    if (state[id].mustSee) {
      // update preview
      $(thumbnailOverlay).find('.must-see-btn').toggleClass('highlighted', state[id].mustSee);
    }
  }

  let progress = $('<div class="loader-wrapper hidden"><span class="progress-value">0%</span><div class="loader"></div></div>');

  col.appendChild(thumbnail);
  thumbnail.appendChild(thumbnailOverlay);
  thumbnail.appendChild(progress[0]);
  thumbnail.appendChild(img);

  $('.gallery').append(col);
}

function toThumbnail(file) {
  return loadImage(file)
    .then((img) => drawToCanvas(img, file.id))
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

function drawToCanvas(img, id) {
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
  canvas.setAttribute('data-id', id);
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  return canvas;
}

let processImages = {};

function collectImageData() {
  processImages = {};

  for (let i = 0; i < selectedFiles.length; i++) {
    let file = selectedFiles[i];
    let meta = state[file.id];

    if (meta) {
      processImages[file.name] = {
        "cover": meta.cover || false,
        "rotation": meta.rotation || 0,
        "mustSee": meta.mustSee || false,
      }
    } else {
      processImages[file.name] = {
        "cover": false,
        "rotation": 0,
        "mustSee": false
      }
    }
  }

  console.log(processImages);

}

$('#upload').on('click', function(){
  collectImageData();

  let throttle = +$('#throttle').val() || 1;
  let uploads = [];
  let filesToBeUploaded = selectedFiles.slice(0);

  let recursiveUpload = function () {
    let file = filesToBeUploaded.shift();

    if (file) {
      return uploadFile(file)
        .then(() => recursiveUpload())
    }
  };

  for (let i = 0; i < throttle; i++) {
    let uploadPromise = recursiveUpload();
    uploads.push(uploadPromise)
  }

  Promise.all(uploads)
    .then(() => {
      console.log('all files successfully uploaded');
    })
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

    // update state
    let id = canvas.attr('data-id');
    if (!state[id]) {
      state[id] = {};
    }
    state[id].rotation = rotation;
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
      // uncover previously covered image
      for (let id in state) {
        if (state[id].cover) {
          state[id].cover = false;
        }
      }
    }

    // toggle value
    cover = !cover;

    // update preview
    event.target.classList.toggle('highlighted', cover);

    // update metadata
    canvas.attr('data-cover', cover);

    // update state
    let id = canvas.attr('data-id');
    if (!state[id]) {
      state[id] = {};
    }
    state[id].cover = cover;
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

    // update state
    let id = canvas.attr('data-id');
    if (!state[id]) {
      state[id] = {};
    }
    state[id].mustSee = mustSee;
  });

  /////////////////////////////////////////////////
  // HANDLE PAGINATION DROPDOWN
  /////////////////////////////////////////////////
  $('#pagination-dropdown').change(function (event) {
    updatePagination(selectedFiles, +$(this).val());

    showPage(1)
  });

  /////////////////////////////////////////////////
  // HANDLE PAGINATION (actual switching)
  /////////////////////////////////////////////////
  $('.pagination').on('click', '.page-link', function (event) {
    showPage(+$(this).text());
  });
});

function uploadFile(file) {
  return new Promise((res, rej) => {
    let xhr = new XMLHttpRequest();

    xhr.upload.onprogress = function (evt) {
      let percentComplete = parseInt(100.0 * evt.loaded / evt.total);

      let relatedCanvas = $('canvas[data-id="' + file.id + '"]');
      console.log(relatedCanvas)
      if (relatedCanvas.length) {
        let loadingWrapper = relatedCanvas.closest('.thumbnail').find('.loader-wrapper');
        if (loadingWrapper) {
          loadingWrapper.removeClass('hidden');
          loadingWrapper.find('.progress-value').text(percentComplete);

          if (percentComplete === 100) {
            loadingWrapper.addClass('completed')
          }
        }
      }
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        res()
      } else {
        rej();
      }
    };

    xhr.open('POST', 'https://content.dropboxapi.com/2/files/upload');
    xhr.setRequestHeader('Authorization', 'Bearer eB1-0FMyyqAAAAAAAAAACTnGrf8Wf_t0-81yiRxs73IhYltggC7U-K61BTDiNol7');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('Dropbox-API-Arg', JSON.stringify({
      path: '/uploader/' + file.name,
      mode: 'add',
      autorename: true,
      mute: false
    }));

    xhr.send(file);
  });

}

function updatePagination(selectedFiles, filesPerPage) {
  $('#container').addClass('show-pagination');
  let paginationContainer = $('.pagination');

  let currentPagesCount = $('#pagination-row .page-item').length;
  let newPagesCount =  Math.ceil(selectedFiles.length / filesPerPage);

  if (newPagesCount !== currentPagesCount) {
    paginationContainer.empty();
    for (let i = 1; i <= newPagesCount; i++) {
      paginationContainer.append('<li class="page-item"><a class="page-link" href="#">' +  i + '</a></li>')
    }
    if (!$('.page-item.active').length) {
      // highlight first page if nothing selected
      $('.page-item:eq(0)').addClass('active');
    }
  }
}

function showPage(page) {
  let itemsPerPage = +$('#pagination-dropdown').val();
  let start = itemsPerPage * (page - 1);
  let end = start + itemsPerPage;
  let pageImages = selectedFiles.slice(start, end);

  $('.page-item.active').removeClass('active');
  $('.page-item:eq('+ (page - 1) + ')').addClass('active');

  $('.gallery').empty();

  for (let i = 0; i < pageImages.length; i++) {
    toThumbnail(pageImages[i])
      .then(img => createThumbnail(img))
      .catch(console.error);
  }
}