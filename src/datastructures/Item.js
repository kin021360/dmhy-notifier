class Item {
    constructor({creator, title, link, pubDate, author, enclosure, content, contentSnippet, guid, categories, isoDate}) {
        this.creator = creator;
        this.title = title;
        this.link = link;
        this.enclosure = enclosure;
        this.isoDate = new Date(isoDate);
    }
}

module.exports = Item;