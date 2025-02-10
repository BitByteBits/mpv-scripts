/**
 * https://github.com/BitByteBits/mpv-scripts
 *
 * MPV Auto Translate Titles
 *
 * Translates the title of the currently playing media file to English using Google Translate unless it contains [TL] in the media title.
 * @TODO: check if maybe in the future I can set force-media-title to change the title in playlist without messing up the order similar to https://github.com/tomasklaen/uosc/issues/793
 */

var opts = {
    active: true, // active by default
    curl: "scurl", // curl executable filename
	destination: "en" // destination language
};

var msg = mp.msg, utils = mp.utils;
mp.options.read_options(opts, "translate_title");

function displayOverlay(text) {
	var a = mp.create_osd_overlay("ass-events")
	a.data = "{\\an9}{\\c&00ff00&}" + text
	a.update()
	setTimeout(function() { a.remove() }, mp.get_property("osd-duration"));
}

function capitalize(str) {
    return str.split(' ').map(function (word) {
        var first = word.charAt(0);
        return first.toUpperCase() + word.slice(1);
    }).join(' ');
}

function setTitle(title) {
    mp.set_property("file-local-options/force-media-title", capitalize(title));
    mp.set_property("title", capitalize(title));
}

function getCacheFilePath() {
	var dir = mp.command_native(["expand-path", "~~/"]);
	return mp.utils.join_path(dir, 'translated-titles.json');
}

function loadCache() {
    var cacheFilePath = getCacheFilePath();
    if (utils.file_info(cacheFilePath)) {
        var cacheContent = utils.read_file(cacheFilePath);
        return JSON.parse(cacheContent);
    }
    return {};
}

function saveCache(cache) {
    var cacheFilePath = getCacheFilePath();
    utils.write_file("file://" + cacheFilePath, JSON.stringify(cache));
}

function translateTitle(dest) {
    if (!opts.active) return;

    var title = mp.get_property("media-title").trim();
    // don't translate if it has [TL] in title
    if (typeof title === 'string' && title.match(/\[TL\]/)) {
        //displayOverlay("Filename is already translated");
		msg.warn("Title is already translated");
        return;
    }

    var cache = loadCache();
    if (cache[title]) {
        var translated = cache[title];
        setTitle(translated);
        //displayOverlay("Loaded from cache: " + translated);
		msg.info("Loaded from cache: " + translated);
        return;
    }

    var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + dest + '&dt=t&q=' + encodeURIComponent(title);
    mp.command_native_async({
        name: "subprocess",
        args: [opts.curl, "-s", url],
        capture_stderr: true,
        capture_stdout: true
    }, function (success, result, error) {
        if (success) {
            var response = JSON.parse(result.stdout);
            var translated = response[0][0][0];
            var sourceLang = response[2];
            // dont't translate if destination language is same as source but still cache to not requests it again later
            if (dest == sourceLang) {
                //displayOverlay("Title is already in " + dest);
                cache[title] = title;
                saveCache(cache);
                msg.info("Title is already in " + dest.toUpperCase());
                return;
            }

            cache[title] = translated;
            saveCache(cache);
            setTitle(translated);
            //displayOverlay("Translated via Google: " + translated);
			msg.info("Translated via Google: " + translated);
        } else {
            msg.error("Translation failed: " + error);
        }
    });
}

mp.register_event("file-loaded", function () {
    translateTitle(opts.destination);
});
