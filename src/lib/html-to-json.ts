// HTML to Unlayer JSON converter
// Converts HTML to Unlayer (react-email-editor) JSON format
// Ported from web/jsonScript/script.js

function parseStyleTagCSS(doc: Document) {
  const rules: Record<string, Record<string, string>> = {};
  const styleTags = doc.querySelectorAll('style');

  styleTags.forEach((styleTag) => {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styleTag.textContent || '');
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSStyleRule) {
          rules[rule.selectorText] = rules[rule.selectorText] || {};
          for (const [key, val] of Object.entries(rule.style)) {
            if (typeof val === 'string') {
              rules[rule.selectorText][key.toLowerCase()] = val;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse <style> tag:', e);
    }
  });
  return rules;
}

function getEffectiveStyle(node: Element, cssRules: Record<string, Record<string, string>> = {}) {
  const inline = getComputedStyleFromDoc(node);
  let matchedRules: Record<string, string> = {};
  for (const selector in cssRules) {
    try {
      if (node.matches(selector)) {
        matchedRules = {
          ...matchedRules,
          ...cssRules[selector],
        };
      }
    } catch (e) {
      // ignore invalid selectors
    }
  }
  return { ...matchedRules, ...inline };
}

function extractBackgroundColors(el: Element) {
  const style = el?.getAttribute?.('style') || '';
  const inlineStyles = (el as HTMLElement)?.style || {};

  let rowColor = '';
  let columnColor = '';
  let backgroundImage = '';

  const bgColorMatch = style.match(/background-color\s*:\s*([^;]+)/i);
  if (bgColorMatch) {
    columnColor = bgColorMatch[1].trim();
  } else if ((inlineStyles as any).backgroundColor) {
    columnColor = (inlineStyles as any).backgroundColor;
  }

  const bgImageMatch = style.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i);
  if (bgImageMatch && bgImageMatch[2]) {
    backgroundImage = bgImageMatch[2].trim();
  }

  if (!backgroundImage && el?.getAttribute?.('background')) {
    backgroundImage = el.getAttribute('background')!.trim();
  }

  return {
    rowColor,
    columnColor,
    backgroundImage,
  };
}

function generateUniqueId() {
  return Math.random().toString(36).substring(2, 11);
}

function defaultCounters() {
  return {
    u_row: 0,
    u_column: 0,
    u_content_text: 0,
    u_content_image: 0,
    u_content_button: 0,
    u_content_social: 0,
    u_content_carousel: 0,
  };
}

function defaultBodyValues(doc: Document, cssRules: Record<string, Record<string, string>>) {
  const bodyStyle = getEffectiveStyle(doc.body, cssRules);
  let backgroundColor = bodyStyle['background-color'] || '';

  if (doc.body.hasAttribute('bgcolor')) {
    backgroundColor = doc.body.getAttribute('bgcolor') || '';
  }

  if (doc.body.hasAttribute('style')) {
    const inlineStyle = doc.body.getAttribute('style') || '';
    const bgColorMatch = inlineStyle.match(/background-color\s*:\s*([^;]+)/i);
    if (bgColorMatch && bgColorMatch[1]) {
      backgroundColor = bgColorMatch[1].trim();
    }
  }

  if (!backgroundColor || backgroundColor === 'transparent') {
    backgroundColor = '#ffffff';
  }

  return {
    contentWidth: '600px',
    fontFamily: {
      label: 'Cabin',
      value: "'Cabin',sans-serif",
      url: 'https://fonts.googleapis.com/css?family=Cabin:400,700',
      defaultFont: true,
    },
    textColor: bodyStyle['color'] || '#000000',
    backgroundColor: backgroundColor,
    linkStyle: {
      body: true,
      linkColor: '#0000ee',
      linkHoverColor: '#0000ee',
      linkUnderline: true,
      linkHoverUnderline: true,
    },
    backgroundImage: {
      url: '',
      fullWidth: true,
      repeat: 'no-repeat',
      size: 'custom',
      position: 'top-center',
      customPosition: ['50%', '0%'],
    },
    _meta: {
      htmlID: 'u_body',
      htmlClassNames: 'u_body',
    },
  };
}

function createRow(unlayerJson: any, rowEl: Element, extractedBgColor = '') {
  let bgColor = extractedBgColor || '';
  let bgImage = '';

  if (rowEl.hasAttribute('style')) {
    const styleAttr = rowEl.getAttribute('style') || '';
    const bgColorMatch = styleAttr.match(/background-color\s*:\s*([^;]+)/i);
    if (!bgColor && bgColorMatch?.[1]) {
      bgColor = bgColorMatch[1].trim();
    }

    const bgImageMatch = styleAttr.match(/background-image\s*:\s*url\((['"]?)(.*?)\1\)/i);
    if (bgImageMatch?.[2]) {
      bgImage = bgImageMatch[2].trim();
    }
  }

  return {
    id: generateUniqueId(),
    cells: [] as any[],
    columns: [] as any[],
    values: {
      backgroundColor: 'transparent',
      columnsBackgroundColor: bgColor || '',
      borderRadius: '0px',
      backgroundImage: {
        url: bgImage,
        size: 'custom',
        width: 300,
        height: 450,
        repeat: 'repeat',
        position: 'custom',
        fullWidth: false,
        customPosition: ['0%', '0%'],
      },
      padding: '0px',
      anchor: '',
      hideDesktop: false,
      _meta: {
        htmlID: `u_row_${unlayerJson.counters.u_row + 1}`,
        htmlClassNames: 'u_row',
      },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
      locked: false,
      hideMobile: false,
      noStackMobile: false,
    },
  };
}

function createColumn(unlayerJson: any, row: any, colEl: Element, extractedBgColors: any = {}) {
  let bgColor = '';
  let border: any = {};

  if (extractedBgColors && extractedBgColors.columnColor) {
    bgColor = extractedBgColors.columnColor;
  }

  if (!bgColor) {
    if (colEl.hasAttribute('bgcolor')) {
      bgColor = colEl.getAttribute('bgcolor') || '';
    } else if ((colEl as HTMLElement).style?.backgroundColor) {
      bgColor = (colEl as HTMLElement).style.backgroundColor;
    } else if (colEl.hasAttribute('style')) {
      const styleAttr = colEl.getAttribute('style') || '';
      const bgColorMatch = styleAttr.match(/background-color\s*:\s*([^;]+)/i);
      if (bgColorMatch && bgColorMatch[1]) {
        bgColor = bgColorMatch[1].trim();
      }
    }
  }

  if (bgColor) {
    bgColor = bgColor.trim();
    if (bgColor === 'transparent') {
      bgColor = '';
    }
  }

  const style = getEffectiveStyle(colEl);
  if (style['border'] || style['border-width']) {
    border = {
      width: style['border-width'] || '1px',
      style: style['border-style'] || 'solid',
      color: style['border-color'] || '#9cd3ec',
    };
  }

  return {
    id: generateUniqueId(),
    contents: [],
    values: {
      backgroundColor: bgColor || '',
      verticalAlign: 'middle',
      borderRadius: '0px',
      border: border?.width
        ? {
            borderTopColor: border.color || '#9cd3ec',
            borderTopStyle: border.style || 'solid',
            borderTopWidth: border.width || '1px',
            borderLeftColor: border.color || '#9cd3ec',
            borderLeftStyle: border.style || 'solid',
            borderLeftWidth: border.width || '1px',
            borderRightColor: border.color || '#9cd3ec',
            borderRightStyle: border.style || 'solid',
            borderRightWidth: border.width || '1px',
            borderBottomColor: border.color || '#9cd3ec',
            borderBottomStyle: border.style || 'solid',
            borderBottomWidth: border.width || '1px',
          }
        : {},
      _meta: {
        htmlID: `u_column_${unlayerJson.counters.u_column + 1}`,
        htmlClassNames: 'u_column',
      },
      deletable: true,
    },
  };
}

function getComputedStyleFromDoc(node: Element) {
  const style: Record<string, string> = {};

  if (!node) return style;

  if (node.getAttribute('style')) {
    node
      .getAttribute('style')!
      .split(';')
      .forEach((rule) => {
        const [key, value] = rule.split(':');
        if (key && value) {
          style[key.trim().toLowerCase()] = value.trim();
        }
      });
  }

  if (node.getAttribute('align')) {
    style['text-align'] = node.getAttribute('align')!.toLowerCase();
  }

  if (node.getAttribute('valign')) {
    style['vertical-align'] = node.getAttribute('valign')!.toLowerCase();
  }

  if (!style['font-size']) style['font-size'] = '14px';
  if (!style['line-height']) style['line-height'] = '1.4';
  if (!style['text-align']) style['text-align'] = 'center';
  if (!style['color']) style['color'] = '#000000';
  if (!style['font-family']) style['font-family'] = "'Cabin', sans-serif";
  if (!style['font-weight']) style['font-weight'] = 'normal';
  if (!style['background-color']) style['background-color'] = 'transparent';
  if (!style['padding']) style['padding'] = '10px 20px';

  return style;
}

function getAllContentElements(root: Element) {
  const validTags = ['P', 'IMG', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BUTTON', 'A', 'TD', 'SPAN', 'DIV'];
  const elements: Element[] = [];
  
  function walk(node: Element) {
    if (!node || node.nodeType !== 1) return;
    if (validTags.includes(node.tagName)) {
      elements.push(node);
    }
    for (let child of Array.from(node.children)) {
      walk(child);
    }
  }
  walk(root);
  return Array.from(new Set(elements));
}

function processContentElement(unlayerJson: any, column: any, element: Element, cssRules: Record<string, Record<string, string>>) {
  if (!element || !element.tagName) return;

  if (element.tagName.toLowerCase() === 'img') {
    addImageContent(unlayerJson, column, element as HTMLImageElement);
  } else if (element.tagName.toLowerCase() === 'a') {
    const imgInside = element.querySelector('img');
    if (imgInside) {
      addImageContent(unlayerJson, column, imgInside as HTMLImageElement, element as HTMLAnchorElement);
    } else {
      addButtonContent(unlayerJson, column, element as HTMLAnchorElement);
    }
  } else if (element.tagName.toLowerCase() === 'button') {
    addButtonContent(unlayerJson, column, element as HTMLButtonElement);
  } else if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'DIV'].includes(element.tagName)) {
    if (element.textContent?.trim()) {
      addTextContent(unlayerJson, column, element);
    }
  }
}

function addTextContent(unlayerJson: any, column: any, el: Element) {
  const wrapper = document.createElement('div');
  wrapper.appendChild(el.cloneNode(true));

  const style = getEffectiveStyle(el);
  const computedStyle = window.getComputedStyle(el as HTMLElement);

  let fontSize = style['font-size'] || computedStyle.fontSize || '14px';
  const fontSizeNum = parseInt(fontSize, 10);
  if (fontSizeNum > 36) fontSize = '36px';
  if (fontSizeNum < 14) fontSize = '14px';

  column.contents.push({
    id: generateUniqueId(),
    type: 'text',
    values: {
      containerPadding: style['padding'] || '10px',
      text: wrapper.innerHTML.trim(),
      fontSize: fontSize || '8px',
      lineHeight: style['line-height'] || computedStyle.lineHeight || '1.5',
      textAlign: style['text-align'] || computedStyle.textAlign || 'left',
      color: style['color'] || computedStyle.color || '#000000',
      fontFamily: style['font-family'] || computedStyle.fontFamily || "'Cabin', sans-serif",
      fontWeight: style['font-weight'] || computedStyle.fontWeight || 'normal',
      anchor: '',
      hideDesktop: false,
      hideMobile: false,
      _meta: {
        htmlID: `u_content_text_${unlayerJson.counters.u_content_text + 1}`,
        htmlClassNames: 'u_content_text',
      },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
      locked: false,
    },
  });
}

function addImageContent(unlayerJson: any, column: any, imgEl: HTMLImageElement, linkEl: HTMLAnchorElement | null = null) {
  column.contents.push({
    id: generateUniqueId(),
    type: 'image',
    values: {
      containerPadding: '10px',
      src: {
        url: imgEl.src || '',
        width: imgEl.width || '100px',
        height: imgEl.height || 'auto',
        maxWidth: '100%',
        autoWidth: true,
      },
      textAlign: 'center',
      altText: imgEl.alt || 'Image',
      action: linkEl
        ? { name: 'web', values: { href: linkEl.href || '', target: linkEl.target || '_blank' } }
        : { name: 'web', values: { href: '', target: '_blank' } },
      _meta: {
        htmlID: `u_content_image_${unlayerJson.counters.u_content_image + 1}`,
        htmlClassNames: 'u_content_image',
      },
      borderRadius: '4px',
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
      locked: false,
    },
  });
}

function addButtonContent(unlayerJson: any, column: any, buttonEl: HTMLAnchorElement | HTMLButtonElement) {
  const buttonText = buttonEl.textContent?.trim().toLowerCase() || '';
  if (buttonText.includes('view in browser')) {
    return;
  }

  const style = getEffectiveStyle(buttonEl);
  const computedStyle = window.getComputedStyle(buttonEl);

  let bgColor = style['background-color'] || computedStyle.backgroundColor || '#3AAEE0';
  let textColor = style['color'] || computedStyle.color || '#ffffff';

  if (bgColor === 'transparent') {
    bgColor = '#3AAEE0';
  }

  column.contents.push({
    id: generateUniqueId(),
    type: 'button',
    values: {
      containerPadding: '10px',
      href: {
        name: 'web',
        values: {
          href: (buttonEl as HTMLAnchorElement).href || '',
          target: (buttonEl as HTMLAnchorElement).target || '_blank',
        },
      },
      buttonColors: {
        color: textColor,
        backgroundColor: bgColor,
        hoverColor: textColor,
        hoverBackgroundColor: bgColor,
      },
      fontSize: style['font-size'] || computedStyle.fontSize || '16px',
      padding: style['padding'] || computedStyle.padding || '10px 20px',
      textAlign: style['text-align'] || computedStyle.textAlign || 'center',
      borderRadius: '4px',
      text: `<span>${buttonEl.textContent?.trim() || ''}</span>`,
      _meta: {
        htmlID: `u_content_button_${unlayerJson.counters.u_content_button + 1}`,
        htmlClassNames: 'u_content_button',
      },
      selectable: true,
      draggable: true,
      duplicatable: true,
      deletable: true,
      hideable: true,
      locked: false,
    },
  });
}

function updateCounters(unlayerJson: any) {
  const counters = defaultCounters();
  counters.u_row = unlayerJson.body.rows.length;

  unlayerJson.body.rows.forEach((row: any) => {
    counters.u_column += row.columns.length;
    row.columns.forEach((column: any) => {
      column.contents.forEach((content: any) => {
        const type = content.type;
        if ((counters as any)[`u_content_${type}`] !== undefined) {
          (counters as any)[`u_content_${type}`]++;
        }
      });
    });
  });

  unlayerJson.counters = counters;
}

export function convertHtmlToJson(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const cssRules = parseStyleTagCSS(doc);

  const unlayerJson: any = {
    counters: defaultCounters(),
    body: {
      id: generateUniqueId(),
      rows: [] as any[],
      headers: [] as any[],
      footers: [] as any[],
      values: defaultBodyValues(doc, cssRules),
    },
    schemaVersion: 16,
  };

  let rows = Array.from(
    doc.querySelectorAll('.u-row, .es-footer-body, .es-header-body, .es-content-body')
  );
  
  if (rows.length === 0) {
    const wrapper = doc.querySelector('.es-wrapper');
    if (wrapper) {
      rows = Array.from(wrapper.querySelectorAll('table'));
    }
  }
  
  if (rows.length === 0) rows = [doc.body];

  rows.forEach((rowEl) => {
    const bgColors = extractBackgroundColors(rowEl);
    const row = createRow(unlayerJson, rowEl, bgColors.rowColor);

    let columnsInRow: Element[] = [];
    const directTds = Array.from(rowEl.querySelectorAll(':scope > tr > td'));
    if (directTds.length > 0) {
      columnsInRow = directTds;
    } else {
      const directTables = Array.from(rowEl.querySelectorAll(':scope > table'));
      if (directTables.length > 0) {
        columnsInRow = directTables;
      } else {
        columnsInRow = [rowEl];
      }
    }

    if (columnsInRow.length === 0) columnsInRow = [rowEl];

    row.cells = new Array(columnsInRow.length).fill(1);

    columnsInRow.forEach((colEl) => {
      const colBgColors = extractBackgroundColors(colEl);
      const column = createColumn(unlayerJson, row, colEl, colBgColors);

      const contentElements = getAllContentElements(colEl);
      contentElements.forEach((element) => {
        processContentElement(unlayerJson, column, element, cssRules);
      });

      if (column.contents.length > 0) {
        row.columns.push(column);
      }
    });

    if (row.columns.some((col: any) => col.contents.length > 0)) {
      row.cells = new Array(row.columns.length).fill(1);
      unlayerJson.body.rows.push(row);
    }
  });

  updateCounters(unlayerJson);

  return unlayerJson;
}
