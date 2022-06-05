declare function getViewerConfiguration(): {
    appContainer: HTMLElement;
    mainContainer: HTMLDivElement;
    viewerContainer: HTMLDivElement;
    toolbar: {
        /**
         * Container for the secondary toolbar.
         */
        container: HTMLDivElement;
        /**
         * Label that contains number of pages.
         */
        numPages: HTMLSpanElement;
        /**
         * Control for display and user input of the current page number.
         */
        pageNumber: HTMLInputElement;
        /**
         * Scale selection control.
         * Its width is adjusted, when necessary, on UI localization.
         */
        scaleSelect: HTMLSelectElement;
        /**
         * The item used to display a non-predefined scale.
         */
        customScaleOption: HTMLOptionElement;
        /**
         * Button to go to the previous page.
         */
        previous: HTMLButtonElement;
        /**
         * Button to go to the next page.
         */
        next: HTMLButtonElement;
        /**
         * Button to zoom in the pages.
         */
        zoomIn: HTMLButtonElement;
        /**
         * Button to zoom out the pages.
         */
        zoomOut: HTMLButtonElement;
        /**
         * Button to open find bar.
         */
        viewFind: HTMLButtonElement;
        /**
         * Button to open a new document.
         */
        openFile: HTMLButtonElement;
        print: HTMLButtonElement;
        /**
         * Button to switch to presentation mode.
         */
        presentationModeButton: HTMLButtonElement;
        /**
         * Button to download the document.
         */
        download: HTMLButtonElement;
        /**
         * Button to obtain a bookmark link to the current location in the document.
         */
        viewBookmark: HTMLAnchorElement;
    };
    secondaryToolbar: {
        /**
         * Container for the secondary toolbar.
         */
        toolbar: HTMLDivElement;
        /**
         * Button to toggle the visibility of the secondary toolbar.
         */
        toggleButton: HTMLButtonElement;
        /**
         * Button for entering presentation mode.
         */
        presentationModeButton: HTMLButtonElement;
        /**
         * Button to open a file.
         */
        openFileButton: HTMLButtonElement;
        printButton: HTMLButtonElement;
        /**
         * Button to download the document.
         */
        downloadButton: HTMLButtonElement;
        /**
         * Button to obtain a bookmark link to the current location in the document.
         */
        viewBookmarkButton: HTMLAnchorElement;
        /**
         * Button to go to the first page in the document.
         */
        firstPageButton: HTMLButtonElement;
        /**
         * Button to go to the first page in the document.
         */
        lastPageButton: HTMLButtonElement;
        /**
         * Button to rotate the pages clockwise.
         */
        pageRotateCwButton: HTMLButtonElement;
        /**
         * Button to rotate the pages counterclockwise.
         */
        pageRotateCcwButton: HTMLButtonElement;
        /**
         * Button to enable the select tool.
         */
        cursorSelectToolButton: HTMLButtonElement;
        /**
         * Button to enable the hand tool.
         */
        cursorHandToolButton: HTMLButtonElement;
        scrollPageButton: HTMLButtonElement;
        scrollVerticalButton: HTMLButtonElement;
        scrollHorizontalButton: HTMLButtonElement;
        scrollWrappedButton: HTMLButtonElement;
        spreadNoneButton: HTMLButtonElement;
        spreadOddButton: HTMLButtonElement;
        spreadEvenButton: HTMLButtonElement;
        /**
         * Button for opening the document properties dialog.
         */
        documentPropertiesButton: HTMLButtonElement;
    };
    sidebar: {
        /**
         * The outer container (encasing both the viewer and sidebar elements).
         */
        outerContainer: HTMLDivElement;
        /**
         * The sidebar container (in which the views are placed).
         */
        sidebarContainer: HTMLDivElement;
        /**
         * The button used for opening/closing the sidebar.
         */
        toggleButton: HTMLButtonElement;
        /**
         * The button used to show the thumbnail view.
         */
        thumbnailButton: HTMLButtonElement;
        /**
         * The button used to show the outline view.
         */
        outlineButton: HTMLButtonElement;
        /**
         * The button used to show the attachments view.
         */
        attachmentsButton: HTMLButtonElement;
        /**
         * The button used to show the layers view.
         */
        layersButton: HTMLButtonElement;
        /**
         * The container in which the thumbnails are placed.
         */
        thumbnailView: HTMLDivElement;
        /**
         * The container in which the outline is placed.
         */
        outlineView: HTMLDivElement;
        /**
         * The container in which the attachments are placed.
         */
        attachmentsView: HTMLDivElement;
        /**
         * The container in which the layers are placed.
         */
        layersView: HTMLDivElement;
        outlineOptionsContainer: HTMLDivElement;
        currentOutlineItemButton: HTMLButtonElement;
    };
    sidebarResizer: {
        /**
         * The outer container (encasing both the viewer and sidebar elements).
         */
        outerContainer: HTMLDivElement;
        /**
         * The DOM element that can be dragged in
         * order to adjust the width of the sidebar.
         */
        resizer: HTMLDivElement;
    };
    findBar: {
        bar: HTMLDivElement;
        toggleButton: HTMLButtonElement;
        findField: HTMLInputElement;
        highlightAllCheckbox: HTMLInputElement;
        caseSensitiveCheckbox: HTMLInputElement;
        matchDiacriticsCheckbox: HTMLInputElement;
        entireWordCheckbox: HTMLInputElement;
        findMsg: HTMLSpanElement;
        findResultsCount: HTMLSpanElement;
        findPreviousButton: HTMLButtonElement;
        findNextButton: HTMLButtonElement;
    };
    passwordOverlay: {
        /**
         * The overlay's DOM element.
         */
        dialog: HTMLDialogElement;
        /**
         * Label containing instructions for entering the password.
         */
        label: HTMLParagraphElement;
        /**
         * Input field for entering the password.
         */
        input: HTMLInputElement;
        /**
         * Button for submitting the password.
         */
        submitButton: HTMLButtonElement;
        /**
         * Button for cancelling password entry.
         */
        cancelButton: HTMLButtonElement;
    };
    documentProperties: {
        /**
         * The overlay's DOM element.
         */
        dialog: HTMLDialogElement;
        /**
         * Button for closing the overlay.
         */
        closeButton: HTMLButtonElement;
        /**
         * Names and elements of the overlay's fields.
         */
        fields: {
            fileName: HTMLParagraphElement;
            fileSize: HTMLParagraphElement;
            title: HTMLParagraphElement;
            author: HTMLParagraphElement;
            subject: HTMLParagraphElement;
            keywords: HTMLParagraphElement;
            creationDate: HTMLParagraphElement;
            modificationDate: HTMLParagraphElement;
            creator: HTMLParagraphElement;
            producer: HTMLParagraphElement;
            version: HTMLParagraphElement;
            pageCount: HTMLParagraphElement;
            pageSize: HTMLParagraphElement;
            linearized: HTMLParagraphElement;
        };
    };
    errorWrapper: {
        container: HTMLDivElement;
        errorMessage: HTMLSpanElement;
        closeButton: HTMLButtonElement;
        errorMoreInfo: HTMLTextAreaElement;
        moreInfoButton: HTMLButtonElement;
        lessInfoButton: HTMLButtonElement;
    };
    printContainer: HTMLDivElement;
    openFileInput: HTMLInputElement;
    debuggerScriptPath: string;
};
export declare type ViewerConfiguration = ReturnType<typeof getViewerConfiguration>;
export {};
//# sourceMappingURL=viewer.d.ts.map