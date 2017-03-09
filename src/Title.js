export default class {

  constructor() { }

  render() {
    rendition.on("rendered", function(section) {
      var current = book.navigation.get(section.href);

      var title = document.getElementById("title");
      if (current) {
        title.textContent = current.label;
      }
      var chapter = document.getElementById('section')
      if (chapter) {
        chapter.textContent = section.idref;
      }
    });
  }
}
