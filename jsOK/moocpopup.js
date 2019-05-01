
var g_cdata = {};
var ckeditors = {};
var ck_options = {
    toolbar: [ "heading", "bold", "italic", "link", "bulletedList", "numberedList", "blockQuote", "undo", "redo" ]
    };
var last_week_id = 1;

function sort_stringdate(a, b) {
    if(a < b) return 1;
    if(a > b) return -1;
    return 0;
}

function show_data(json) {
    clear_form();
    change_buttons(false);
    $("#form").css("display", "");

    var cdata = json;
    g_cdata = cdata;
    var cdata_elm = $("#course_data");
    var dates = cdata["start_dates"];
    var end_dates = cdata["end_dates"];
    dates.sort(sort_stringdate);
    end_dates.sort(sort_stringdate);

    for (var i = 0; i <  dates.length; i++) {
        var d = dates[i].split("-");
        var str = d[2] + '/' + d[1] + '/' + d[0];
        $("#course_start_dates").append("<option class='' value='" + dates[i] + "'>" + str + "</option>");
    }

    if (dates.length == 0) {
        $("#no-dates").css("display", "inline");
    }


    $.each(ckeditors,
        function (index, editor) {
            var data = cdata[index.substring(7)];
            if (data === null) 
                return;
            var regex = /(<br\s*\/?>\s*<br\s*\/?>)+/gi; // matches multiple br tags
            console.log(data);
            data = data.replace(regex, '<br>');
            console.log(data);
            regex = /<br\s*[\/]?>/gi; // matches <br>, <br/>, <br />, etc
            data = data.replace(regex, '<p></p>'); // ckeditor 5 doesn't support br tags
            console.log(data);
            editor.editor.setData(data);
            editor.element.removeClass('isPlaceholder');
            editor.empty = false;
        });

    cdata_elm.find(".cautofill.jq_val").val(
        function (index, value) {
            console.log("Filling data for: ", [this.id.substring(7)]);
            return cdata[this.id.substring(7)];
        });

    cdata_elm.find("#course_short_title").val(cdata.title.substring(0, 7) + '...');

    console.log("____________________________");

    // cdata_elm.find(".cautofill.jq_html").html(
    //     function (index, value) {
    //         console.log("Filling data for: ", [this.id.substring(7)]);
    //         return cdata[this.id.substring(7)];
    //     });

    $("#course_selfpaced").prop("checked", cdata["selfpaced"]);
    $('#course_selfpaced').trigger('change');
    $('#course_is_custom_date').trigger('change');
    $('#course_start_dates').trigger('change');
}

function send_url() {
    clear_form();
    $("#send_url").prop("disabled", true);
    $.ajax(
        {
            type: "POST",
            url: window.location.href,
            data: JSON.stringify({ url: $("#url").val(), algo: "lol" }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: show_data,
            failure: function(errMsg) {
                console.error(errMsg); 
            },
            complete: function (a) {
                $("#send_url").prop("disabled", false);
                // $("#add_manually").css("display", "none");
                setTimeout(
                    function() {
                    }, 500); 

            }
        }
    );
}

function submit_form() {
    $("#submit_form").prop("disabled", true);

    var obj = {};
    var cdata_elm = $("#course_data");

    cdata_elm.find(".cautosave.jq_val").each(
        function (index, value) {
            obj[value.id.substring(7)] = value.value;
        });

    cdata_elm.find(".cautosave.jq_check").each(
        function (index, value) {
            obj[value.id.substring(7)] = value.checked;
        });

    cdata_elm.find(".cautosave.jq_html").each(
        function (index, value) {
            obj[value.id.substring(7)] = value.innerHTML;
        });

    $.each(ckeditors,
        function (index, editor) {
            obj[index.substring(7)] = editor.editor.getData();
        });

    obj["_url"] = $("#url").val();
    obj["syllabus_weeks"] = last_week_id;

    console.log(obj);
    console.log("obj length: " + Object.keys(obj).length);

    // $.ajax(
    //     {
    //         type: "POST",
    //         url: window.location.href,
    //         data: JSON.stringify({ url: $("#url").val(), algo: "lol" }),
    //         contentType: "application/json; charset=utf-8",
    //         //dataType: "json",
    //         success: show_data,
    //         failure: function(errMsg) { alert();alert("Error", errMsg); }
    //     }
    // );

    setTimeout(
        function() {
            $("#submit_form").prop("disabled", false);
        }, 500);
}

function initEditor(id, editor, placeholder) {
    ckeditors[id] = { empty: true, editor: editor, element: $('#' + id).find('div') };
    ckeditors[id].editor.setData(placeholder);
    ckeditors[id].element.addClass('isPlaceholder');
    editor.ui.focusTracker.on( 'change:isFocused', ( evt, name, value ) => {
        if (value) {
            if (ckeditors[id].empty) {
                ckeditors[id].editor.setData('');
            }
        } else {
            if (ckeditors[id].element.text() === '') {
                ckeditors[id].editor.setData(placeholder);
                ckeditors[id].empty = true;
                ckeditors[id].element.addClass('isPlaceholder');
            } else {
                ckeditors[id].empty = false;
                ckeditors[id].element.removeClass('isPlaceholder');
            }
        }
    } );
}

function create_editors() {

    InlineEditor.create( $('#course_description').find('div')[0], ck_options ).then( editor => { 
        // ckeditors['course_description'] = { empty: true, editor: editor, element: $('#course_description').find('div') };
        initEditor('course_description', editor, 'Description');
    }).catch( error => {
        console.error( error );
    } );

    InlineEditor.create( $('#course_syllabus').find('div')[0], ck_options ).then( editor => { 
        initEditor('course_syllabus', editor, 'Syllabus');
    } ).catch( error => {
        console.error( error );
    } );
}

function change_buttons(first) {
    if (first) {
        // $("#add_manually").css("display", "");
        $("#send_url").css("display", "");
        // $("#submit_form").css("display", "none");
        // $("#clear-form").css("display", "none");
    } else {
        $("#add_manually").css("display", "none");
        // $("#send_url").css("display", "none");
        $("#submit_form").css("display", "");
        $("#clear-form").css("display", "");
    }
}

$(document).ready(function (event) {
    create_editors();

    $('.extra-info').addClass("blur");

    $("#send_url").click(send_url);

    $("#url").keypress(function (e) {
        if (e.which == 13) {
            send_url();
            return false;
        }
    });

    $("#add_manually").click(function () {
        $("#form").css("display", "");
        change_buttons(false);
    });

    $("#clear-form").click(function () {
        // $("#form").css("display", "none");
        change_buttons(true);
        clear_form();
    });

    $("#submit_form").click(submit_form);

    $(".close-x").click(function (e) {
        clear_form();
    });

    $("#course_duration").change(function (e) {
        $('#course_start_dates').trigger('change');
        $('#course_start_date').trigger('change');
    });

    $("#course_duration_unit").change(function (e) {
        $('#course_start_dates').trigger('change');
        $('#course_start_date').trigger('change');
    });

    $("#course_selfpaced").change(function (e) {                
        $("#course_start_date").prop('disabled', this.checked);
        $("#course_start_dates").prop('disabled', this.checked);
        $("#course_end_date").prop('disabled', this.checked);
        $("#course_is_custom_date").prop('disabled', this.checked);
        $("#course_duration_unit").prop('disabled', this.checked);
        $("#course_duration").prop('disabled', this.checked);
        $('#course_is_custom_date').trigger('change');
    });

    $("#course_is_custom_date").change(function (e) {
        if ($("#course_selfpaced").prop('checked')) return;
        $("#course_start_date").prop('disabled', !this.checked);
        $("#course_start_dates").prop('disabled', this.checked);
        $("#course_end_date").prop('disabled', !this.checked);
        $("#course_duration").prop('disabled', this.checked);
        $("#course_duration_unit").prop('disabled', this.checked);
        $('#course_start_dates').trigger('change');
        $('#course_start_date').trigger('change');
        $('#course_end_date').trigger('change');
        $('#course_duration').trigger('change');
        $('#course_duration_unit').trigger('change');
    });

    $("#course_start_date").prop('disabled', true);
    $("#course_end_date").prop('disabled', true);
    // $("#course_duration").prop('disabled', true);
    // $("#course_duration_unit").prop('disabled', true);

    $("#course_start_dates").change(function (e) {
        var checked = $("#course_is_custom_date").prop("checked");
        if (!checked) {
            set_end_date(this.value);
            $("#course_start_date").val(this.value);
        }

    });

    $("#course_start_date").change(function (e) {
        var checked = $("#course_is_custom_date").prop("checked");
        if (!checked)
            set_end_date(this.value);
    });

    $("#show_more").click(function (e) {
        var text =  $(this).text();

        if (text === "Show more") {
            $(this).text("Show less");
        } else {                        
            $('.modal').animate({ scrollTop: 0 }, 1000);

            $(this).text("Show more");
        }
        $('.modal-content').toggleClass("show-extra", 1000);
        $('.extra-info').toggleClass("blur", 1000);
    });

    $("#add_week").click(function (e) {
        var id = "course_week_" + last_week_id;
        $("#syllabus_weeks").append("<div class='info-separator'><label class='extra-info sub' for='course_syllabus'>\
                        <i title='Course syllabus' class='fas fa-graduation-cap'></i>" + (last_week_id) +
                    "</label>\
                    <div class='extra-info cautofill jq_html cautosave'  name='course_desc' id='" + id + "' placeholder='Course Syllabus'>\
                        <div contenteditable='true' type='text'></div>\
                    </div></div>");

        InlineEditor.create( $('#syllabus_weeks').find('#' + id).find('div')[0], ck_options ).then( editor => { 
            // ckeditors[id] = editor;
            initEditor(id, editor, 'Week ' + last_week_id);
            //clear_form();
            console.log(Array.from( editor.ui.componentFactory.names() ));
            last_week_id += 1;
        } ).catch( error => {
            console.error( error );
        } );


    });

    $("#remove_week").click(function (e) {
        $("#syllabus_weeks").children().last().remove();
        if (last_week_id > 1)
            last_week_id--;
            var id = "course_week_" + last_week_id;
            delete ckeditors[id];
    });

    $(".modal").css("display", "inline"); 

    $(document).ready(function () {
        $(".tablinks").click(function () {
            console.log(this.value);
            var id = "#" + this.value + "-tab";
            $(".tabcontent").css("display", "none");
            $(".tabcontent").toggleClass("active");
            $(".tablinks").removeClass("active");
            $(this).addClass("active");
            $(id).css("display", "");
        });
    });
    // $( document ).tooltip({ show: null, tooltipClass: "tooltip-custom" });
    $(document).tooltip({
        content: function () {
            return $(this).prop('title');
        }, tooltipClass: "tooltip-custom"
    });
});

function set_end_date(date) {
    var duration = $("#course_duration").val();
    var duration_unit = $("#course_duration_unit").val();
    var d = date.split("-");
    var end_date = new Date(date);
    var days = 0;

    if (duration_unit == 'W') {        // weeks
        days = 7 * parseInt(duration);
    } else if (duration_unit == 'S') { // sessions
        days = 7 * parseInt(duration);
    } else if (duration_unit == 'D') { // days
        days = parseInt(duration);
    } else if (duration_unit == 'H') { // hours
        days = parseInt(duration) / 24.0;
    } 

    end_date.setDate(end_date.getDate() + days);
    var date_str = end_date.getFullYear() + "-" + ("0" + (end_date.getMonth() + 1)).substr(-2) + "-" + ("0" + (end_date.getDate())).substr(-2);
    if (date_str.includes("NaN")) 
    	date_str = "";
    $("#course_end_date").val(date_str);
}

function clear_form() {
    $("#course_start_date").prop('disabled', true);
    $("#course_end_date").prop('disabled', true);
    $("#course_start_dates").prop('disabled', false);
    $("#course_data")[0].reset();
    $("#course_start_dates").empty();
    $("#no-dates").css("display", "none");

    $.each(ckeditors, function (index, editor) {
        editor.editor.setData("");
    });
}
