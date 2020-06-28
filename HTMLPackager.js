const debug = require('debug')('parcel:remove-dot-html');
const posthtml = require('posthtml');

const MATCHER_NODES = [
  {tag: 'a', attrs: {href: true}},
  {tag: 'link', attrs: {href: true}}
];

module.exports = (SuperHTMLPackager) => {
  return class HTMLPackager extends SuperHTMLPackager {
    constructor(...args) {
      super(...args);
      this.publicURL = this.options.publicURL;
      this.removeDotHTML = this.removeDotHTML.bind(this);
    }

    async addAsset(asset) {
      const {html} = asset.generated;
      asset.generated = await posthtml(this.removeDotHTML).process(html);

      return super.addAsset(asset);
    }

    removeDotHTML(tree) {
      if ('development' == process.env.NODE_ENV) {
        debug('$NODE_ENV is "development", skipping %s', this.bundle.getHashedBundleName());

        return tree;
      }

      let count = 0;

      tree.match(MATCHER_NODES, (node) => {
        const { href } = node.attrs;
        if (href.indexOf(this.publicURL) === 0 && href.slice(-11) === '/index.html') {
          count += 1;
          node.attrs.href = href.slice(0, -10); // Preserve trailing slash.
        }

        return node;
      });

      tree.match(MATCHER_NODES, (node) => {
        const {href} = node.attrs;
        if (href.indexOf(this.publicURL) === 0 && href.slice(-5) === '.html') {
          count += 1;
          node.attrs.href = href.slice(0, -5);
        }

        return node;
      });

      debug('Processed %s: removed %d occurrences', this.bundle.getHashedBundleName(), count);

      return tree;
    }
  };
};
