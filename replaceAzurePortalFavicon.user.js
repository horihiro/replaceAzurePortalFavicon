// ==UserScript==
// @name         Replace Azure Portal Favicon
// @namespace    http://horihiro.net/
// @version      0.3
// @description  Replace Azure portal favicon to Azure resource icon
// @author       horihiro
// @match        https://portal.azure.com/*
// @match        https://ms.portal.azure.com/*
// @downloadURL  https://github.com/horihiro/replaceAzurePortalFavicon/raw/main/replaceAzurePortalFavicon.user.js
// @updateURL    https://github.com/horihiro/replaceAzurePortalFavicon/raw/main/replaceAzurePortalFavicon.meta.js
// @grant        none
// ==/UserScript==

(async function() {
  'use strict';

  const faviconOrig = document.querySelectorAll('link[rel="icon"]')[0];
  const faviconAzureResource = document.createElement('link');
  const head = faviconOrig.parentNode;
  faviconAzureResource.setAttribute('rel', 'icon');
  faviconAzureResource.setAttribute('type', 'image/svg+xml');
  [...head.querySelectorAll('link[rel*="shortcut"][rel*="icon"]')].forEach((icon) => {
    head.removeChild(icon);
  });

  const updateFavicon = (faviconLink) => {
    const links = head.querySelectorAll('link[rel="icon"]');
    if (links[0] === faviconLink) return;
    [...links].forEach((link) => {
      head.removeChild(link);
    });
    head.appendChild(faviconLink);
  };

  const classNames2style = (classNames) => {
    const styleObj = classNames.reduce((prev, curr) => {
      if (curr.trim() === "") return prev;
      [...document.styleSheets].forEach((styleSheet) => {
        [...styleSheet.cssRules].forEach((rule) => {
          if (rule.selectorText !== `.${curr}`) return;
          prev[rule.style[0]] = rule.style[rule.style[0]];
        });
      });
      return prev;
    }, {});
    return `style="${Object.keys(styleObj).reduce((prev, curr) => {
      return `${prev}${curr}: ${styleObj[curr]}; `
    }, '').trim()}"`;
  };
  const getSvgData = (svg) => {
    const use = svg.querySelector('use');
    if (!use) return svg.outerHTML;
    const symbolElm = document.querySelector(use.getAttribute('href'));
    const symbolContent = symbolElm.firstChild.outerHTML;
    const styledSymbolContent = [...symbolContent.matchAll(/ class="([^"]+)"/g)].reduce((prev, curr) => {
      const styleText = classNames2style(curr[1].split(/ /));
      return prev.replaceAll(` class="${curr[1]}"`, ` ${styleText}`);
    }, symbolContent);
    return `<svg xmlns="http://www.w3.org/2000/svg" height="100%" width="100%" viewBox="${symbolElm.getAttribute('viewBox')}" aria-hidden="true" role="presentation" focusable="false">${[...styledSymbolContent.matchAll(/url\(#([^\)]*)\)/g)].reduce((prev, curr) => {
      return `${document.getElementById(curr[1]).outerHTML}${prev}`;
    }, styledSymbolContent)}</svg>`;
  };

  const scriptname = GM_info.script.name;

  let lastFavicon = null;
  const mainObserver = new MutationObserver(async (mutations) => {
    if (mutations.filter((mutation) => mutation.addedNodes.length > 0 && [...mutation.addedNodes].filter((addedNode) => addedNode.nodeName.toLowerCase() === 'link' && addedNode.getAttribute('rel') === 'icon').length > 0).length > 0) return;
    const mainIconSvgs = document.querySelectorAll('section:last-of-type div.azc-listView-group:first-child li.fxs-portal-focus:first-child svg');
    const listIconSvgs = [...document.querySelectorAll('section:last-of-type div.fxc-gc-row-content>div:nth-child(2) svg')];
    if ((mainIconSvgs.length === 0 || mainIconSvgs[0] === lastFavicon) && (listIconSvgs.length === 0 || !listIconSvgs.every(svg => listIconSvgs[0].outerHTML === svg.outerHTML))) {
      mainIconSvgs.length === 0 && updateFavicon(faviconOrig);
      return;
    }
    lastFavicon = mainIconSvgs[0] || listIconSvgs[0];

    const svgData = getSvgData(lastFavicon);
    faviconAzureResource.href = `data:image/svg+xml,${encodeURIComponent(svgData)}`;
    updateFavicon(faviconAzureResource);
  });
  mainObserver.observe(document, { childList: true, subtree: true });
  console.debug(`[${scriptname}]Observation starts.`);
  // End desktop notification
})();
