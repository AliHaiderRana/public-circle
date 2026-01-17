/**
 * Footer utilities for BeeFree editor
 * Adapts the footer functionality from Unlayer to work with BeeFree JSON format
 */

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export interface FooterOptions {
  showPoweredBy?: boolean;
  includeUnsubscribe?: boolean;
  publicCirclesLogoUrl?: string;
}

/**
 * Creates footer rows JSON for BeeFree editor
 * Returns an array of row objects that can be added to the template
 */
export function createBeeFooterRows(options: FooterOptions = {}) {
  const {
    showPoweredBy = true,
    includeUnsubscribe = true,
    publicCirclesLogoUrl = 'https://publiccircles.com/logo.png', // Default logo URL
  } = options;

  const rows: any[] = [];

  // Desktop Row (single line, hide on mobile)
  let desktopHtmlContent = '';
  if (showPoweredBy) {
    desktopHtmlContent += `<span class="footer-poweredby" style="display: inline-flex; align-items: center;">
      <span>Powered by</span>
      <a href="https://publiccircles.com" style="pointer-events: auto; display: inline-flex; align-items: center; text-decoration: none; margin-left: 4px">
        <img src="${publicCirclesLogoUrl}" alt="Public Circles" style="height: 16px; vertical-align: middle; pointer-events: auto" />
      </a>
    </span>`;
  }
  if (showPoweredBy && includeUnsubscribe) {
    desktopHtmlContent += `<span style="display: inline-flex; justify-content: center; align-items: center; background-color: transparent; color: #ffffff; width: 20px; height: 20px; margin: 0 6px; white-space: nowrap;">•</span>`;
  }
  if (includeUnsubscribe) {
    desktopHtmlContent += `<span style="white-space: nowrap; color: #ffffff;"><a href="{{unsubscribe}}" style="color: #ffffff; text-decoration: underline; pointer-events: auto; margin-top: 4px;">Unsubscribe</a><span> from Emails</span></span>`;
  }

  if ((showPoweredBy || includeUnsubscribe) && desktopHtmlContent.trim() !== '') {
    const desktopRow = {
      id: generateUniqueId(),
      cells: [1],
      columns: [
        {
          id: generateUniqueId(),
          contents: [
            {
              id: generateUniqueId(),
              type: 'text',
              values: {
                containerPadding: '10px',
                text: `<div style="text-align: center; line-height: 1.5; font-size: 14px;">${desktopHtmlContent}</div>`,
                fontSize: '14px',
                lineHeight: '1.5',
                textAlign: 'center',
                color: '#ffffff',
                fontFamily: "'Cabin', sans-serif",
                fontWeight: 'normal',
                anchor: '',
                hideDesktop: false,
                hideMobile: true,
                _meta: {
                  htmlID: 'u_content_text_footer_desktop',
                  htmlClassNames: 'u_content_text',
                },
                selectable: false,
                draggable: false,
                duplicatable: false,
                deletable: false,
                hideable: false,
                locked: true,
              },
            },
          ],
          values: {
            backgroundColor: '#000000',
            padding: '10px',
            width: '100%',
            border: {},
            _meta: { htmlID: 'u_column_footer_desktop', htmlClassNames: 'u_column' },
            deletable: false,
          },
        },
      ],
      values: {
        backgroundColor: 'transparent',
        columnsBackgroundColor: '',
        padding: '0px',
        backgroundImage: {
          url: '',
          fullWidth: true,
          repeat: 'no-repeat',
          size: 'custom',
          position: 'top-center',
          customPosition: ['50%', '0%'],
        },
        anchor: '',
        hideDesktop: false,
        hideMobile: false,
        _meta: { htmlID: 'u_row_footer_desktop', htmlClassNames: 'u_row' },
        _override: { mobile: { hideMobile: true } },
        hideable: false,
        noStackMobile: false,
        locked: true,
        selectable: false,
        draggable: false,
        duplicatable: false,
        deletable: false,
        hideable: false,
        columns: false,
      },
    };
    rows.push(desktopRow);
  }

  // Mobile Row (stacked, hide on desktop)
  let mobileHtmlContentPoweredBy = '';
  if (showPoweredBy) {
    mobileHtmlContentPoweredBy = `<span style="white-space: normal; color: #ffffff;">Powered by <a href="https://publiccircles.com" style="pointer-events: auto; display: inline-block; text-decoration: none; margin-left: 4px; color: #ffffff;"><img src="${publicCirclesLogoUrl}" alt="Public Circles" style="height: 16px; vertical-align: middle; pointer-events: auto; border: none; mso-table-lspace:0pt; mso-table-rspace:0pt;"></a></span>`;
  }

  let mobileHtmlContentUnsubscribe = '';
  if (includeUnsubscribe) {
    mobileHtmlContentUnsubscribe = `<span style="white-space: normal; color: #ffffff;"><a href="{{unsubscribe}}" style="color: #ffffff; text-decoration: underline; pointer-events: auto;">Unsubscribe</a><span> from Emails</span></span>`;
  }

  if (
    (showPoweredBy || includeUnsubscribe) &&
    (mobileHtmlContentPoweredBy.trim() !== '' || mobileHtmlContentUnsubscribe.trim() !== '')
  ) {
    const mobileRow = {
      id: generateUniqueId(),
      cells: [1],
      columns: [
        {
          id: generateUniqueId(),
          contents: [] as any[],
          values: {
            backgroundColor: '#000000',
            padding: '10px',
            width: '100%',
            border: {},
            _meta: { htmlID: 'u_column_footer_mobile', htmlClassNames: 'u_column' },
            deletable: false,
          },
        },
      ],
      values: {
        backgroundColor: 'transparent',
        columnsBackgroundColor: '',
        padding: '0px',
        backgroundImage: {
          url: '',
          fullWidth: true,
          repeat: 'no-repeat',
          size: 'custom',
          position: 'top-center',
          customPosition: ['50%', '0%'],
        },
        anchor: '',
        hideDesktop: false,
        hideMobile: false,
        _meta: { htmlID: 'u_row_footer_mobile', htmlClassNames: 'u_row' },
        _override: { desktop: { hideDesktop: true } },
        selectable: false,
        draggable: false,
        duplicatable: false,
        deletable: false,
        hideable: false,
        locked: true,
        noStackMobile: false,
      },
    };

    if (mobileHtmlContentPoweredBy.trim() !== '') {
      mobileRow.columns[0].contents.push({
        id: generateUniqueId(),
        type: 'text',
        values: {
          containerPadding: '5px',
          text: `<div style="text-align: center; line-height: 1.5; font-size: 14px;">${mobileHtmlContentPoweredBy}</div>`,
          fontSize: '14px',
          lineHeight: '1.5',
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: "'Cabin', sans-serif",
          fontWeight: 'normal',
          hideDesktop: true,
          hideMobile: false,
          _meta: { htmlID: 'u_content_text_powered_by_mobile', htmlClassNames: 'u_content_text' },
          selectable: false,
          draggable: false,
          duplicatable: false,
          deletable: false,
          hideable: false,
          locked: true,
        },
      });
    }

    if (mobileHtmlContentUnsubscribe.trim() !== '') {
      mobileRow.columns[0].contents.push({
        id: generateUniqueId(),
        type: 'text',
        values: {
          containerPadding: '5px',
          text: `<div style="text-align: center; line-height: 1.5; font-size: 14px;">${mobileHtmlContentUnsubscribe}</div>`,
          fontSize: '14px',
          lineHeight: '1.5',
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: "'Cabin', sans-serif",
          fontWeight: 'normal',
          hideDesktop: true,
          hideMobile: false,
          _meta: { htmlID: 'u_content_text_unsubscribe_mobile', htmlClassNames: 'u_content_text' },
          selectable: false,
          draggable: false,
          duplicatable: false,
          deletable: false,
          hideable: false,
          locked: true,
        },
      });
    }

    if (mobileRow.columns[0].contents.length > 0) {
      rows.push(mobileRow);
    }
  }

  return rows;
}

/**
 * Adds footer to an existing BeeFree template design
 */
export function addFooterToBeeTemplate(
  design: any,
  options: FooterOptions = {}
): any {
  const updatedDesign = { ...design };
  
  // Check if footer already exists
  const hasFooter = design?.body?.rows?.some((row: any) =>
    row.values?._meta?.htmlID?.includes('footer') ||
    row.columns?.some((column: any) =>
      column.contents?.some((content: any) =>
        content.values?.text?.includes('Powered by') ||
        content.values?.text?.includes('{{unsubscribe}}')
      )
    )
  );

  if (hasFooter) {
    // Remove existing footer
    updatedDesign.body.rows = design.body.rows.filter((row: any) =>
      !row.values?._meta?.htmlID?.includes('footer') &&
      !row.columns?.some((column: any) =>
        column.contents?.some((content: any) =>
          content.values?.text?.includes('Powered by') ||
          content.values?.text?.includes('{{unsubscribe}}')
        )
      )
    );
  }

  // Add new footer rows
  const footerRows = createBeeFooterRows(options);
  if (updatedDesign.body && updatedDesign.body.rows) {
    updatedDesign.body.rows = [...updatedDesign.body.rows, ...footerRows];
  } else {
    updatedDesign.body = {
      rows: footerRows,
    };
  }

  return updatedDesign;
}
