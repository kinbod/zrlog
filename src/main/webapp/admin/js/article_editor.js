var change = 0;
var uploadUrl = 'api/admin/upload/';
var mdEditor;
$(function () {
    $(".select2_single").select2({
        minimumResultsForSearch: -1,
        allowClear: true,
        dropdownParent: $("#type-select-parent")
    });

    var keywordsEl = $("#keywords");
    keywordsEl.tagsInput({
        height: '68px',
        width: 'auto'
    });
    keywordsEl.importTags($("#keywordsVal").val());
    var tags = $("#keywordsVal").val().split(",");
    for (var tag in tags) {
        var unCheckedTag = $("#unCheckedTag").children("span");
        for (var t in unCheckedTag) {
            if (tags[tag] === $(unCheckedTag[t]).text()) {
                $(unCheckedTag[t]).remove();
            }
        }
    }

    var divW = $("#left_col").width();

    function checkResize() {
        var w = $("#editormd").width();
        if (w !== divW) {
            resizeSize();
            divW = w;
        }
    }

    function resizeSize() {
        mdEditor.resize()
    }

    function zeroPad(num, places) {
        var zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    }

    var editormdTheme = $("#markdown").attr("editormdTheme");
    var dark = editormdTheme === 'dark';
    mdEditor = editormd("editormd", {
        width: "100%",
        height: 840,
        path: editorMdPath,
        toolbarIcons: function () {
            return ["undo", "redo", "|", "bold", "del", "italic", "quote", "|", "h1", "h2", "h3", "h4", "|", "list-ul", "list-ol", "hr", "|", "link", "reference-link", "image", "file", "video", "code", "preformatted-text", "code-block", "table", "datetime", "emoji", "html-entities", "pagebreak", "|", "goto-line", "watch", "fullscreen", "search", "|", "help", "info"]
        },
        toolbarCustomIcons: {
            file: '<a href="javascript:;" id="fileDialog"  title="添加附件" unselectable="on"><i class="fa fa-paperclip" unselectable="on"></i></a>',
            video: '<a href="javascript:;" id="videoDialog"  title="添加视频" unselectable="on"><i class="fa fa-file-video-o" unselectable="on"></i></a>'
        },
        codeFold: true,
        appendMarkdown: $("#markdown").val(),
        saveHTMLToTextarea: true,
        searchReplace: true,
        htmlDecode: "iframe,pre",
        emoji: true,
        taskList: true,
        tocm: true,         // Using [TOCM]
        tex: true,                   // 开启科学公式TeX语言支持，默认关闭
        flowChart: true,             // 开启流程图支持，默认关闭
        sequenceDiagram: true,       // 开启时序/序列图支持，默认关闭,
        dialogMaskOpacity: 0,    // 设置透明遮罩层的透明度，全局通用，默认值为0.1
        dialogMaskBgColor: "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为#fff
        imageUpload: true,
        imageFormats: ["jpg", "jpeg", "gif", "png", "ico", "bmp", "webp"],
        imageUploadURL: uploadUrl,
        theme: dark ? "dark" : "default",
        previewTheme: dark ? "dark" : "default",
        editorTheme: dark ? "pastel-on-dark" : "default",

        onchange: function () {
            change = 1;
        },
        onload: function () {
            $("#content").val(mdEditor.getPreviewedHTML());
            var keyMap = {
                "Ctrl-S": function (cm) {
                    change = 1;
                    autoSave();
                }
            }
            this.addKeyMap(keyMap);
            setInterval(checkResize, 200);
            $("#fileDialog").on("click", function () {
                mdEditor.executePlugin("fileDialog", "../plugins/file-dialog/file-dialog");
            });
            $("#videoDialog").on("click", function () {
                mdEditor.executePlugin("videoDialog", "../plugins/video-dialog/video-dialog");
            });

        },
        onfullscreen: function () {
            $("#editormd").css("z-index", "9999")
        },

        onfullscreenExit: function () {
            $("#editormd").css("z-index", 0)
        }

    });
    $(".editormd-markdown-textarea").attr("name", "mdContent");
    $(".editormd-html-textarea").removeAttr("name");

    function checkPreviewLink() {
        if ($("#logId").val() == null || $("#logId").val() == '') {
            $("#preview").attr("disable", "disable");
        } else {
            updatePreviewLink($("#logId").val());
        }
    }

    checkPreviewLink();

    function updatePreviewLink(id) {
        $("#preview-link").attr("href", "admin/article/preview?id=" + id);
        $("#preview").removeClass("btn-")
        $("#preview-link").show();
    }

    function tips(data, message) {
        if (data.error === 0) {
            new PNotify({
                title: message,
                type: 'success',
                hide: true,
                delay: 3000,
                styling: 'bootstrap3'
            });
            $("#logId").val(data.logId);
            $("#alias").val(data.alias);
            currentThumbnail = $("#thumbnail").val();
            if (data.thumbnail != currentThumbnail) {
                $("#thumbnail-img").attr("src", data.thumbnail);
                $("#thumbnail").val(data.thumbnail);
            }
            updatePreviewLink(data.logId);
        } else {
            new PNotify({
                title: data.message,
                type: 'error',
                hide: true,
                delay: 3000,
                styling: 'bootstrap3'
            });
        }
    }

    function validationPost() {
        $("input[name='table-align']").remove();
        $("#content").val(mdEditor.getPreviewedHTML());
        if ($("#title").val() == "" || $("#content").val() == "") {
            new PNotify({
                title: '文章的标题和内容都不能为空...',
                delay: 3000,
                type: 'warn',
                hide: true,
                styling: 'bootstrap3'
            });
            return false;
        }
        return true;
    }

    var saving = false;
    var xhr;
    var lastChangeRequestBody;

    function autoSave() {
        if (change && validationPost()) {
            if (xhr !== null && saving) {
                xhr.abort();
            }
            refreshKeywords();
            var tLastChangeRequestBody = $('#article-form').serialize();
            if (tLastChangeRequestBody !== lastChangeRequestBody) {
                saving = true;
                xhr = $.post('api/admin/article/createOrUpdate?rubbish=1', tLastChangeRequestBody, function (data) {
                    var date = new Date();
                    saving = false;
                    tips(data, "自动保存成功 " + zeroPad(date.getHours(), 2) + ":" + zeroPad(date.getMinutes(), 2) + ":" + zeroPad(date.getSeconds(), 2));
                    lastChangeRequestBody = tLastChangeRequestBody;
                });
            }
            change = 0;
        }
    }

    setInterval(autoSave, 1000 * 6);

    $(document.body).on('click', '#unCheckedTag .tag2', function (e) {
        keywordsEl.importTags($(this).text());
        $(this).remove();
        e.preventDefault();
        refreshKeywords();
    });
    $(document.body).on('click', "#keywords_tagsinput .tag2 a", function () {
        var text = $(this).siblings().text().trim();
        $(this).parent().remove();
        $("#unCheckedTag").append('<span class="tag2"><i class="fa fa-tag">' + text + '</i></span>');
        refreshKeywords();
        return false;
    });

    function refreshKeywords() {
        var ts = $("#keywords_tagsinput .tag2").children("span");
        var keywordsVal = "";
        for (var i = 0; i < ts.length; i++) {
            keywordsVal = keywordsVal + $(ts[i]).text().trim() + ",";
        }
        $("#keywordsVal").val(keywordsVal);
    }

    $("#saveToRubbish").click(function () {
        saveArticle(true)
    });

    $("#createOrUpdate").click(function () {
        saveArticle(false);
    });

    function saveArticle(rubbish) {
        if (validationPost()) {
            refreshKeywords();
            lastChangeRequestBody = $('#article-form').serialize();
            $.post('api/admin/article/createOrUpdate' + (rubbish ? "?rubbish=1" : ""), lastChangeRequestBody, function (data) {
                tips(data, "保存" + (rubbish ? "草稿" : "") + "成功...")
            });
        }
    }

    $('#thumbnail-upload').liteUploader({
        script: 'api/admin/upload/thumbnail?dir=thumbnail'
    }).on('lu:success', function (e, response) {
        if (response.error) {
            alert(response.message);
        } else {
            $("#thumbnail-img").css('background-image', "url('" + response.url + "')");
            var w = gup("w", response.url);
            var h = gup("h", response.url);
            if (w < 660) {
                h = 660.0 / w * h;
            }
            $("#thumbnail-img").height(h);
            $("#thumbnail").val(response.url);
            $("#camera-icon").hide()
        }

    });
});

function gup(name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}