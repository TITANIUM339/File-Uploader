export default (extension) => {
    const extensions = {
        jpg: "image",
        jpeg: "image",
        png: "image",
        gif: "image",
        bmp: "image",
        svg: "image",
        webp: "image",

        mp4: "video",
        mkv: "video",
        mov: "video",
        avi: "video",
        wmv: "video",
        flv: "video",
        webm: "video",

        mp3: "audio",
        wav: "audio",
        aac: "audio",
        flac: "audio",
        ogg: "audio",
        m4a: "audio",

        zip: "archive",
        rar: "archive",
        "7z": "archive",
        tar: "archive",
        gz: "archive",

        pdf: "pdf",

        doc: "richtext",
        docx: "richtext",
        odt: "richtext",

        ppt: "slides",
        pptx: "slides",
        ppsx: "slides",
        odp: "slides",

        c: "source",
        cpp: "source",
        java: "source",
        py: "source",
        js: "source",
        rb: "source",
        swift: "source",
        php: "source",
        cs: "source",
        kt: "source",
        lua: "source",
        sh: "source",
        h: "source",
        css: "source",
        html: "source",
        rs: "source",
        go: "source",

        xlsx: "spreadsheet",
        xls: "spreadsheet",
        csv: "spreadsheet",
        ods: "spreadsheet",

        txt: "text",
        log: "text",

        otf: "font",
        ttf: "font",
        woff: "font",
        woff2: "font",

        exe: "binary",
        bin: "binary",
        elf: "binary",
        dll: "binary",
    };

    switch (extensions[extension]) {
        case "image":
            return "bi bi-file-earmark-image";

        case "binary":
            return "bi bi-file-earmark-binary";

        case "font":
            return "bi bi-file-earmark-font";

        case "source":
            return "bi bi-file-earmark-code";

        case "audio":
            return "bi bi-file-earmark-music";

        case "pdf":
            return "bi bi-file-earmark-pdf";

        case "video":
            return "bi bi-file-earmark-play";

        case "richtext":
            return "bi bi-file-earmark-richtext";

        case "spreadsheet":
            return "bi bi-file-earmark-spreadsheet";

        case "slides":
            return "bi bi-file-earmark-slides";

        case "text":
            return "bi bi-file-earmark-text";

        case "archive":
            return "bi bi-file-earmark-zip";

        default:
            return "bi bi-file-earmark";
    }
};
