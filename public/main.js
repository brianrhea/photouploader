/*jshint esversion: 6 */

inp.onchange = e => {
  Promise.all([...inp.files].map(toThumbnail))
    .then(function(imgs){
      $(imgs).each(function(index, img){

        var col = document.createElement('div');
        col.classList = "col-3";

        var thumbnail = document.createElement('div');
        thumbnail.classList = "thumbnail position-relative";

        var thumbnailOverlay = document.createElement('div');
        thumbnailOverlay.classList = "thumbnail-overlay py-1 px-3 d-flex justify-content-between position-absolute";

        const icons = "<i class='material-icons'>rotate_right</i><i class='material-icons'>image</i><i class='material-icons'>flash_on</i>";

        $(thumbnailOverlay).append(icons);

        col.appendChild(thumbnail);
        thumbnail.appendChild(thumbnailOverlay);
        thumbnail.appendChild(img);

        $('.gallery').append(col);

      });
    })
    // .then(imgs => document.body.append.apply(document.body, imgs.filter(v => v)))
    .catch(console.error);
};

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