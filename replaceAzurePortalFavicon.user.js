// ==UserScript==
// @name         Replace Azure Portal Favicon
// @namespace    http://horihiro.net/
// @version      0.5
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

  let faviconOrig = document.querySelectorAll('link[rel="icon"]')[0];
  if (!faviconOrig) {
    faviconOrig = document.createElement('link');
    faviconOrig.setAttribute('rel', 'icon');
    faviconOrig.setAttribute('type', 'image/x-icon');
    faviconOrig.setAttribute('href', '/Content/favicon.ico');
  }
  const faviconAzureResource = document.createElement('link');
  const head = document.head;
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

  let lastFavicon = faviconOrig;
  const mainObserver = new MutationObserver(async (mutations) => {
    if (mutations.filter((mutation) => mutation.addedNodes.length > 0 && [...mutation.addedNodes].filter((addedNode) => addedNode.nodeName.toLowerCase() === 'link' && addedNode.getAttribute('rel') === 'icon').length > 0).length > 0) return;
    const mainIconContainers =
          document.querySelectorAll(
            `${
              document.querySelectorAll('div.fxs-sidebar div.azc-listView-group:first-child ').length > 0
              ? 'div.fxs-sidebar'
              : 'section:last-of-type'
            } div.azc-listView-group:first-child li.fxs-portal-focus:first-child`
          );
    const listIconSvgs = [...document.querySelectorAll('section:last-of-type div.fxc-gc-row-content>div:nth-child(2) svg')];
    const noResIconSvgs = document.querySelectorAll('section:last-of-type div.ext-hubs-artbrowse-empty div.msportalfx-svg-disabled svg');
    if (mainIconContainers.length === 0 && (listIconSvgs.length === 0 || !listIconSvgs.every(svg => listIconSvgs[0].outerHTML === svg.outerHTML)) && (noResIconSvgs.length === 0)) {
      updateFavicon(faviconOrig);
      return;
    }
    const mainIcon = mainIconContainers.length > 0 ? mainIconContainers[0].querySelectorAll('svg,img')[0] : null;
    if ((!mainIcon && !listIconSvgs[0] && !noResIconSvgs[0] )|| mainIcon === lastFavicon) {
      !mainIcon && updateFavicon(faviconOrig);
      return;
    }
    lastFavicon = mainIcon || listIconSvgs[0] || noResIconSvgs[0];

    faviconAzureResource.href = lastFavicon.src || `data:image/svg+xml,${encodeURIComponent(getSvgData(lastFavicon))}`;
    updateFavicon(faviconAzureResource);
  });
  mainObserver.observe(document, { childList: true, subtree: true });
  console.debug(`[${scriptname}]Observation starts.`);
  // End desktop notification
})();
