'use strict';
(function() {
  const NUMPHOTOS = 518;

  window.addEventListener('load', init);

  function init() {
    let photos = document.querySelectorAll('.photo');
    for (let i = 0; i < photos.length; i++) {
      let x = Math.floor((Math.random() * NUMPHOTOS)+1);;
      photos[i].src = "img/img (" + x + ").jpg";
      photos[i].addEventListener('mouseover', changePhoto);
      photos[i].addEventListener('click', changePhoto);
    }
  }

  function changePhoto(){
    let x = Math.floor((Math.random() * NUMPHOTOS)+1);;
    this.src = "img/img (" + x + ").jpg";
  }
})();
