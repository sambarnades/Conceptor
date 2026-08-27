/** @namespace H5P */
H5P.VideoYouTube = (function ($) {

  /**
   * YouTube video player for H5P.
   *
   * @class
   * @param {Array} sources Video files to use
   * @param {Object} options Settings for the player
   * @param {Object} l10n Localization strings
   */
  function YouTube(sources, options, l10n) {
    var self = this;

    var player;
    // PATCH Caramel (sous-titres) — passe à true dès que l'utilisateur choisit lui-même une
    // piste dans le menu « CC » : voir disableDefaultCaptions() dans create().
    var captionsTrackChosen = false;
    var playbackRate = 1;
    var id = 'h5p-youtube-' + numInstances;
    numInstances++;
    var ratio = 9/16;
    var $wrapper = $('<div/>');
    var $placeholder = $('<div />', {
      text: l10n.loading,
      html: `<div style="position: relative; padding: ${ratio*100}% 0 0 0;"><div id="${id}"></div></div>`
    }).appendTo($wrapper);

    // Optional placeholder
    // var $placeholder = $('<iframe id="' + id + '" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/' + getId(sources[0].path) + '?enablejsapi=1&origin=' + encodeURIComponent(ORIGIN) + '&autoplay=' + (options.autoplay ? 1 : 0) + '&controls=' + (options.controls ? 1 : 0) + '&disabledkb=' + (options.controls ? 0 : 1) + '&fs=0&loop=' + (options.loop ? 1 : 0) + '&rel=0&showinfo=0&iv_load_policy=3" frameborder="0"></iframe>').appendTo($wrapper);

    /**
     * PATCH Caramel — positionne l'iframe YouTube en absolu dans son conteneur.
     * Remplace l'accès à la propriété minifiée `player.g` (cassée par YouTube).
     *
     * @private
     */
    var styleIframe = function () {
      var iframe = null;
      try {
        if (player && typeof player.getIframe === 'function') {
          iframe = player.getIframe();
        }
      }
      catch (err) {}
      if (!iframe) {
        iframe = document.getElementById(id);
      }
      if (iframe && iframe.style) {
        iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
      }
    };

    /**
     * Use the YouTube API to create a new player
     *
     * @private
     */
    var create = function () {
      if (!$placeholder.is(':visible') || player !== undefined) {
        return;
      }

      if (window.YT === undefined) {
        // Load API first
        loadAPI(create);
        return;
      }
      if (YT.Player === undefined) {
        return;
      }

      var width = $wrapper.width();
      if (width < 200) {
        width = 200;
      }

      var loadCaptionsModule = true;

      /**
       * PATCH Caramel — sous-titres affichés d'office sur les vidéos YouTube.
       *
       * `player.loadModule('captions')` (plus bas) ne fait pas que rendre les pistes
       * listables : il demande au lecteur d'ACTIVER sa piste par défaut. Sur une vidéo à
       * sous-titres AUTOMATIQUES (kind « asr »), cette piste existe toujours — les
       * sous-titres apparaissent donc dès la lecture, sans que l'auteur les ait demandés.
       * Pire, H5P n'en sait rien : pour une piste asr, `getOption('captions','tracklist')`
       * revient VIDE, l'événement `captions` n'est jamais émis, et le bouton « CC » de la
       * barre H5P n'est même pas construit — l'utilisateur n'a aucun moyen de les couper.
       * D'où le symptôme : case « Intégrer les sous-titres » DÉCOCHÉE dans l'éditeur
       * Caramel, sous-titres pourtant affichés dans la vidéo.
       *
       * On neutralise donc la sélection par défaut, SAUF si l'auteur a réellement déclaré
       * une piste de sous-titres : `options.tracks` est alimenté par `parameters.a11y`
       * (H5P.Video), lui-même égal à `interactiveVideo.video.textTracks.videoTrack` du
       * content.json — c'est-à-dire exactement la case de l'éditeur. En pratique, une source
       * YouTube n'a aujourd'hui JAMAIS de piste déclarée (Caramel ne pose `captionUrl` que
       * pour PeerTube) : la condition protège donc les sources qui en ont réellement une,
       * et le jour où le VTT YouTube sera embarqué dans le .h5p elle marchera sans retouche.
       *
       * Attention : après ce `setOption`, `getOption('captions','track')` continue de
       * renvoyer la piste asr alors que l'affichage est bien coupé (vérifié par capture
       * d'écran). Ne jamais s'en servir comme oracle de test.
       *
       * @private
       */
      var disableDefaultCaptions = function () {
        if (captionsTrackChosen || (options.tracks && options.tracks.length)) {
          return;
        }
        try {
          player.setOption('captions', 'track', {});
        }
        catch (err) {}
      };

      var videoId = getId(sources[0].path);

      player = new YT.Player(id, {
        // PATCH Caramel — Erreur 153 : on cible le domaine sans cookies, plus tolérant
        // sur la vérification d'origine de l'embed (idem lecteur de transcription).
        host: 'https://www.youtube-nocookie.com',
        width: width,
        height: width * (9/16),
        videoId: videoId,
        playerVars: {
          origin: ORIGIN,
          // Hardcoded autoplay to false to avoid playing videos on init
          autoplay: 0,
          controls: options.controls ? 1 : 0,
          disablekb: options.controls ? 0 : 1,
          fs: 0,
          loop: options.loop ? 1 : 0,
          playlist: options.loop ? videoId : undefined,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          wmode: "opaque",
          start: Math.floor(options.startAt),
          playsinline: 1
        },
        events: {
          onReady: function () {
            // PATCH Caramel — l'iframe n'existe pas toujours dès `new YT.Player()`.
            styleIframe();
            self.trigger('ready');
            self.trigger('loaded');

            if (!options.autoplay) {
              self.toPause = true;
            }

            if (options.deactivateSound) {
              self.mute();
            }
          },
          onApiChange: function () {
            if (loadCaptionsModule) {
              loadCaptionsModule = false;

              // Always load captions
              player.loadModule('captions');

              // PATCH Caramel — le module met un instant à s'initialiser. `onApiChange`
              // repasse en principe juste après (branche `else`), mais pas sur toutes les
              // vidéos : deux rappels temporisés garantissent l'extinction.
              setTimeout(disableDefaultCaptions, 500);
              setTimeout(disableDefaultCaptions, 2000);
            }
            else {
              disableDefaultCaptions();
            }

            var trackList;
            try {
              // Grab tracklist from player
              trackList = player.getOption('captions', 'tracklist');
            }
            catch (err) {}
            if (trackList && trackList.length) {

              // Format track list into valid track options
              var trackOptions = [];
              for (var i = 0; i < trackList.length; i++) {
                trackOptions.push(new H5P.Video.LabelValue(trackList[i].displayName, trackList[i].languageCode));
              }

              // Captions are ready for loading
              self.trigger('captions', trackOptions);
            }
          },
          onStateChange: function (state) {
            if (state.data > -1 && state.data < 4) {
              if (self.toPause) {
                // if video buffering, was likely paused already - skip
                if (state.data === H5P.Video.BUFFERING) {
                  delete self.toPause;
                }
                else {
                  self.pause();
                }
              }

              // Fix for keeping playback rate in IE11
              if (H5P.Video.IE11_PLAYBACK_RATE_FIX && state.data === H5P.Video.PLAYING && playbackRate !== 1) {
                // YT doesn't know that IE11 changed the rate so it must be reset before it's set to the correct value
                player.setPlaybackRate(1);
                player.setPlaybackRate(playbackRate);
              }
              // End IE11 fix

              self.trigger('stateChange', state.data);
            }
          },
          onPlaybackQualityChange: function (quality) {
            self.trigger('qualityChange', quality.data);
          },
          onPlaybackRateChange: function (playbackRate) {
            self.trigger('playbackRateChange', playbackRate.data);
          },
          onError: function (error) {
            var message;
            switch (error.data) {
              case 2:
                message = l10n.invalidYtId;
                break;

              case 100:
                message = l10n.unknownYtId;
                break;

              case 101:
              case 150:
                message = l10n.restrictedYt;
                break;

              default:
                message = l10n.unknownError + ' ' + error.data;
                break;
            }
            self.trigger('error', message);
          }
        }
      });
      // PATCH Caramel — « écran noir » : l'original faisait `player.g.style = "..."`,
      // où `g` était le nom MINIFIÉ (donc instable) de la propriété interne de l'API
      // YouTube pointant sur l'iframe. Google l'a renommée → `player.g` vaut undefined
      // → TypeError levée dans create(), l'iframe ne reçoit jamais son positionnement
      // absolu et reste invisible (la vidéo joue pourtant : le chrono avance).
      // On passe par l'API PUBLIQUE getIframe(), avec repli sur l'id du conteneur.
      styleIframe();
    };

    /**
     * Indicates if the video must be clicked for it to start playing.
     * For instance YouTube videos on iPad must be pressed to start playing.
     *
     * @public
     */
    if (navigator.userAgent.match(/iPad/i)) {
      self.pressToPlay = true;
    }
    else {
      try {
        if (document.featurePolicy.allowsFeature('autoplay') === false) {
          self.pressToPlay = true;
        }
      }
      catch (err) {}
    }

    /**
    * Appends the video player to the DOM.
    *
    * @public
    * @param {jQuery} $container
    */
    self.appendTo = function ($container) {
      $container.addClass('h5p-youtube').append($wrapper);
      create();
    };

    /**
     * Get list of available qualities. Not available until after play.
     *
     * @public
     * @returns {Array}
     */
    self.getQualities = function () {
      if (!player || !player.getAvailableQualityLevels) {
        return;
      }

      var qualities = player.getAvailableQualityLevels();
      if (!qualities.length) {
        return; // No qualities
      }

      // Add labels
      for (var i = 0; i < qualities.length; i++) {
        var quality = qualities[i];
        var label = (LABELS[quality] !== undefined ? LABELS[quality] : 'Unknown'); // TODO: l10n
        qualities[i] = {
          name: quality,
          label: LABELS[quality]
        };
      }

      return qualities;
    };

    /**
     * Get current playback quality. Not available until after play.
     *
     * @public
     * @returns {String}
     */
    self.getQuality = function () {
      if (!player || !player.getPlaybackQuality) {
        return;
      }

      var quality = player.getPlaybackQuality();
      return quality === 'unknown' ? undefined : quality;
    };

    /**
     * Set current playback quality. Not available until after play.
     * Listen to event "qualityChange" to check if successful.
     *
     * @public
     * @params {String} [quality]
     */
    self.setQuality = function (quality) {
      if (!player || !player.setPlaybackQuality) {
        return;
      }

      player.setPlaybackQuality(quality);
    };

    /**
     * Start the video.
     *
     * @public
     */
    self.play = function () {
      if (!player || !player.playVideo) {
        self.on('ready', self.play);
        return;
      }
      player.playVideo();
    };

    /**
     * Pause the video.
     *
     * @public
     */
    self.pause = function () {
      delete self.toPause;
      self.off('ready', self.play);
      if (!player || !player.pauseVideo) {
        return;
      }
      player.pauseVideo();
    };

    /**
     * Seek video to given time.
     *
     * @public
     * @param {Number} time
     */
    self.seek = function (time) {
      if (!player || !player.seekTo) {
        return;
      }

      player.seekTo(time, true);
    };

    /**
     * Recreate player with initial time
     *
     * @public
     * @param {Number} time
     */
    self.resetPlayback = function (time) {
      options.startAt = time;

      if (player) {
        if (player.getPlayerState() === H5P.Video.PLAYING) {
          player.pauseVideo();
          self.trigger('stateChange', H5P.Video.PAUSED);
        }
        player.destroy();
        player = undefined;
      }

      create();
    }
    /**
     * Get elapsed time since video beginning.
     *
     * @public
     * @returns {Number}
     */
    self.getCurrentTime = function () {
      if (!player || !player.getCurrentTime) {
        return;
      }

      return player.getCurrentTime();
    };

    /**
     * Get total video duration time.
     *
     * @public
     * @returns {Number}
     */
    self.getDuration = function () {
      if (!player || !player.getDuration) {
        return;
      }

      return player.getDuration();
    };

    /**
     * Get percentage of video that is buffered.
     *
     * @public
     * @returns {Number} Between 0 and 100
     */
    self.getBuffered = function () {
      if (!player || !player.getVideoLoadedFraction) {
        return;
      }

      return player.getVideoLoadedFraction() * 100;
    };

    /**
     * Turn off video sound.
     *
     * @public
     */
    self.mute = function () {
      if (!player || !player.mute) {
        return;
      }

      player.mute();
    };

    /**
     * Turn on video sound.
     *
     * @public
     */
    self.unMute = function () {
      if (!player || !player.unMute) {
        return;
      }

      player.unMute();
    };

    /**
     * Check if video sound is turned on or off.
     *
     * @public
     * @returns {Boolean}
     */
    self.isMuted = function () {
      if (!player || !player.isMuted) {
        return;
      }

      return player.isMuted();
    };

    /**
     * Check if video is loaded and ready to play.
     *
     * @public
     * @returns {Boolean}
     */
    self.isLoaded = function () {
      if (!player || !player.getPlayerState) {
        return;
      }

      return player.getPlayerState() === 5;
    };

    /**
     * Return the video sound level.
     *
     * @public
     * @returns {Number} Between 0 and 100.
     */
    self.getVolume = function () {
      if (!player || !player.getVolume) {
        return;
      }

      return player.getVolume();
    };

    /**
     * Set video sound level.
     *
     * @public
     * @param {Number} level Between 0 and 100.
     */
    self.setVolume = function (level) {
      if (!player || !player.setVolume) {
        return;
      }

      player.setVolume(level);
    };

    /**
     * Get list of available playback rates.
     *
     * @public
     * @returns {Array} available playback rates
     */
    self.getPlaybackRates = function () {
      if (!player || !player.getAvailablePlaybackRates) {
        return;
      }

      var playbackRates = player.getAvailablePlaybackRates();
      if (!playbackRates.length) {
        return; // No rates, but the array should contain at least 1
      }

      return playbackRates;
    };

    /**
     * Get current playback rate.
     *
     * @public
     * @returns {Number} such as 0.25, 0.5, 1, 1.25, 1.5 and 2
     */
    self.getPlaybackRate = function () {
      if (!player || !player.getPlaybackRate) {
        return;
      }

      return player.getPlaybackRate();
    };

    /**
     * Set current playback rate.
     * Listen to event "playbackRateChange" to check if successful.
     *
     * @public
     * @params {Number} suggested rate that may be rounded to supported values
     */
    self.setPlaybackRate = function (newPlaybackRate) {
      if (!player || !player.setPlaybackRate) {
        return;
      }

      playbackRate = Number(newPlaybackRate);
      player.setPlaybackRate(playbackRate);
    };

    /**
     * Set current captions track.
     *
     * @param {H5P.Video.LabelValue} Captions track to show during playback
     */
    self.setCaptionsTrack = function (track) {
      // PATCH Caramel — choix explicite de l'utilisateur : ne plus rien neutraliser ensuite.
      captionsTrackChosen = true;
      player.setOption('captions', 'track', track ? {languageCode: track.value} : {});
    };

    /**
     * Figure out which captions track is currently used.
     *
     * @return {H5P.Video.LabelValue} Captions track
     */
    self.getCaptionsTrack = function () {
      var track = player.getOption('captions', 'track');
      return (track.languageCode ? new H5P.Video.LabelValue(track.displayName, track.languageCode) : null);
    };

    // Respond to resize events by setting the YT player size.
    self.on('resize', function () {
      if (!$wrapper.is(':visible')) {
        return;
      }

      if (!player) {
        // Player isn't created yet. Try again.
        create();
        return;
      }

      // Use as much space as possible
      $wrapper.css({
        width: '100%',
        height: 'auto'
      });

      var width = $wrapper[0].clientWidth;
      var height = options.fit ? $wrapper[0].clientHeight : (width * (9/16));

      // Validate height before setting
      if (height > 0) {
        // Set size
        $wrapper.css({
          width: width + 'px',
          height: height + 'px'
        });

        player.setSize(width, height);
      }
    });
  }

  /**
   * Check to see if we can play any of the given sources.
   *
   * @public
   * @static
   * @param {Array} sources
   * @returns {Boolean}
   */
  YouTube.canPlay = function (sources) {
    return getId(sources[0].path);
  };

  /**
   * Find id of YouTube video from given URL.
   *
   * @private
   * @param {String} url
   * @returns {String} YouTube video identifier
   */

  var getId = function (url) {
    // Has some false positives, but should cover all regular URLs that people can find
    var matches = url.match(/(?:(?:youtube.com\/(?:attribution_link\?(?:\S+))?(?:v\/|embed\/|watch\/|(?:user\/(?:\S+)\/)?watch(?:\S+)v\=))|(?:youtu.be\/|y2u.be\/))([A-Za-z0-9_-]{11})/i);
    if (matches && matches[1]) {
      return matches[1];
    }
  };

  /**
   * Load the IFrame Player API asynchronously.
   */
  var loadAPI = function (loaded) {
    if (window.onYouTubeIframeAPIReady !== undefined) {
      // Someone else is loading, hook in
      var original = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function (id) {
        loaded(id);
        original(id);
      };
    }
    else {
      // Load the API our self
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = loaded;
    }
  };

  /** @constant {Object} */
  var LABELS = {
    highres: '2160p', // Old API support
    hd2160: '2160p', // (New API)
    hd1440: '1440p',
    hd1080: '1080p',
    hd720: '720p',
    large: '480p',
    medium: '360p',
    small: '240p',
    tiny: '144p',
    auto: 'Auto'
  };

  /** @private */
  var numInstances = 0;

  // Extract the current origin (used for security)
  // PATCH Caramel — Erreur 153 « configuration du lecteur vidéo » : en preview
  // h5p-standalone, ce script tourne dans un iframe `about:blank`, donc
  // window.location.href vaut "about:blank" et la regex échoue → ORIGIN=undefined.
  // Depuis fin 2025, YouTube refuse les embeds sans origine valide (Erreur 153). On
  // remonte à la fenêtre du haut (même origine que l'iframe about:blank) pour
  // récupérer l'origine réelle de la page. À réappliquer à chaque MAJ de H5P.Video.
  var ORIGIN;
  try {
    var originHref = window.location.href;
    if (!/^https?:\/\//.test(originHref)) {
      try { originHref = window.top.location.href; }
      catch (e) { originHref = document.referrer || originHref; }
    }
    var originMatch = originHref.match(/http[s]?:\/\/[^\/]+/);
    ORIGIN = originMatch ? originMatch[0] : undefined;
  } catch (e) {
    ORIGIN = undefined;
  }
  // ORIGIN = undefined is needed to support fetching file from device local storage

  return YouTube;
})(H5P.jQuery);

// Register video handler
H5P.videoHandlers = H5P.videoHandlers || [];
H5P.videoHandlers.push(H5P.VideoYouTube);
