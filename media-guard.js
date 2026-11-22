(() => {
  const media = "img, picture, .photo, .cover-art, [data-plate], .portrait, #plate";
  function stopImageAction(event) {
    if (event.target instanceof Element && event.target.closest(media)) event.preventDefault();
  }
  document.addEventListener("contextmenu", stopImageAction, true);
  document.addEventListener("dragstart", stopImageAction, true);
  for (const image of document.images) image.draggable = false;
})();
