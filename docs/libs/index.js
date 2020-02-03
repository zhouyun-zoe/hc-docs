/**
 * Docsify config
 */

window.$docsify = {
  name: "Huobi Chain",
  repo: "https://github.com/HuobiGroup/huobi-chain",
  auto2top: true,
  loadNavbar: true,
  loadSidebar: true,
  mergeNavbar: true,
  subMaxLevel: 2,
  homepage: "README.md",
  search: {
    noData: {
      "/zh-cn/": "找不到结果!",
      "/": "No results!"
    },
    paths: "auto",
    placeholder: {
      "/zh-cn/": "搜索",
      "/": "Search"
    }
  },
  plugins: [
    function(hook, vm) {
      hook.beforeEach(function(html) {
        var url =
          "https://github.com/HuobiGroup/huobi-chain/blob/master/" +
          vm.route.file;
        var editHtml = "[📝 EDIT DOCUMENT](" + url + ")\n";

        return editHtml + html;
      });

    }
  ]
};
