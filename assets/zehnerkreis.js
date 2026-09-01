/**
 * Zehnerkreis, a scorepad for the quiz game Smart 10.
 *
 * Follows the rules of the ORF show, with
 * points instead of euros: every question has ten correct answers to find, and
 * the n-th one found is worth n points — doubled in the bonus questions. The
 * 550 / 1100 euro maximums of the show are 1+2+…+10 = 55 and twice that.
 *
 * https://der.orf.at/unternehmen/programmangebote/fernsehen/sendungen/sendungen-s/smart10_quiz100.html
 *
 * Two players alternate. A correct answer goes into that player's round pot and
 * hands the turn on. Stepping out banks the pot and leaves the opponent to keep
 * collecting; a wrong answer loses the pot. Either way that player is done with
 * the question. A question ends once all ten answers are found or neither
 * player may answer — whoever is still in then keeps their pot — and the next
 * question starts on its own. After the last question the higher total wins.
 */
( function () {
	'use strict';

	var STORAGE_KEY = 'zehnerkreis.state.v4';
	var ANSWERS_PER_QUESTION = 10;
	var MODES = {
		// A short game is three ordinary rounds and the bonus round; a long one
		// runs ten with a bonus in the middle and at the end.
		short: { questions: 4, bonus: [ 4 ] },
		long: { questions: 10, bonus: [ 5, 10 ] }
	};
	var DEFAULT_MODE = 'long';
	var BONUS_SECONDS = 30;
	var TICK_MS = 100;
	var MAX_UNDO = 40;

	var state = null;
	var undoStack = [];

	var el = {};

	// Which question the screen last showed, so a change can be announced.
	var shownQuestion = null;

	function clone( value ) {
		return JSON.parse( JSON.stringify( value ) );
	}

	function other( index ) {
		return 1 - index;
	}

	function newGame( names, mode ) {
		var game = {
			v: 4,
			names: names || [ '', '' ],
			mode: mode || DEFAULT_MODE,
			setup: ! names,
			totals: [ 0, 0 ],
			question: 1,
			starter: 0,
			finished: false,
			last: ''
		};
		startQuestion( game );

		return game;
	}

	/**
	 * Length settings of a game. Takes the game explicitly because
	 * startQuestion() runs while newGame() is still building it.
	 *
	 * @param {Object} [game] The game, defaulting to the current one.
	 */
	function config( game ) {
		return MODES[ ( game || state ).mode ] || MODES[ DEFAULT_MODE ];
	}

	function lastQuestion( game ) {
		return config( game ).questions;
	}

	function isBonus( question, game ) {
		return config( game ).bonus.indexOf( question ) !== -1;
	}

	/** What the next answer of this question is worth. */
	function nextValue() {
		return ( state.found + 1 ) * ( isBonus( state.question ) ? 2 : 1 );
	}

	/** Everything a single question can pay out: 1+2+…+10, doubled in a bonus. */
	function questionMaximum( question, game ) {
		var ladder = ANSWERS_PER_QUESTION * ( ANSWERS_PER_QUESTION + 1 ) / 2;

		return ladder * ( isBonus( question, game ) ? 2 : 1 );
	}

	function startQuestion( game ) {
		game.found = 0;
		game.revealed = 0;
		game.clocks = isBonus( game.question, game ) ? [ BONUS_SECONDS * 1000, BONUS_SECONDS * 1000 ] : null;
		game.running = false;
		game.since = 0;
		game.pots = [ 0, 0 ];
		game.gained = [ 0, 0 ];
		game.out = [ false, false ];
		game.why = [ null, null ];
		game.active = game.starter;

		// Rule 19: the first turn of a bonus round goes to whoever is ahead.
		if ( isBonus( game.question, game ) && game.totals[ 0 ] !== game.totals[ 1 ] ) {
			game.active = game.totals[ 0 ] > game.totals[ 1 ] ? 0 : 1;
		}

		// Rule 16(b): a lead the other player cannot catch even by taking the
		// whole final bonus round puts them out before it — their points are set
		// to zero and the leader plays the round alone.
		if ( lastQuestion( game ) === game.question ) {
			[ 0, 1 ].forEach( function ( index ) {
				if ( game.totals[ index ] + questionMaximum( game.question, game ) < game.totals[ 1 - index ] ) {
					game.totals[ index ] = 0;
					game.out[ index ] = true;
					game.why[ index ] = 'eliminated';
					game.active = 1 - index;
				}
			} );
		}
	}

	function load() {
		var stored;
		try {
			stored = window.localStorage.getItem( STORAGE_KEY );
		} catch ( e ) {
			stored = null;
		}

		if ( stored ) {
			try {
				var parsed = JSON.parse( stored );
				if ( parsed && 4 === parsed.v && 2 === parsed.names.length ) {
					return parsed;
				}
			} catch ( e ) {} // eslint-disable-line no-empty
		}

		return newGame();
	}

	function save() {
		try {
			window.localStorage.setItem( STORAGE_KEY, JSON.stringify( state ) );
		} catch ( e ) {} // eslint-disable-line no-empty
	}

	function checkpoint() {
		undoStack.push( clone( state ) );
		if ( undoStack.length > MAX_UNDO ) {
			undoStack.shift();
		}
	}

	/** Answered and still in: hand over, unless the opponent already dropped out. */
	function passTurn() {
		if ( ! state.out[ other( state.active ) ] ) {
			state.active = other( state.active );
		}
	}

	function correct() {
		state.pots[ state.active ] += nextValue();
		state.found += 1;
		state.revealed += 1;
		passTurn();
	}

	function wrong() {
		state.revealed += 1;
		state.pots[ state.active ] = 0;
		state.out[ state.active ] = true;
		state.why[ state.active ] = 'wrong';
		state.active = other( state.active );
	}

	function stepOut() {
		var pot = state.pots[ state.active ];

		state.gained[ state.active ] += pot;
		state.totals[ state.active ] += pot;
		state.pots[ state.active ] = 0;
		state.out[ state.active ] = true;
		state.why[ state.active ] = pot > 0 ? 'banked' : 'passed';
		state.active = other( state.active );
	}

	/** Milliseconds of playing time a player has left in this bonus round. */
	function remaining( index ) {
		if ( ! state.clocks ) {
			return 0;
		}

		var left = state.clocks[ index ];
		if ( state.running && state.active === index ) {
			left -= Date.now() - state.since;
		}

		return Math.max( 0, left );
	}

	/** Charge the time that has passed to the player whose turn it was. */
	function stopClock() {
		if ( ! state.running ) {
			return;
		}
		state.clocks[ state.active ] = remaining( state.active );
		state.running = false;
	}

	function startClock() {
		if ( ! state.clocks || state.out[ state.active ] || remaining( state.active ) <= 0 ) {
			return;
		}
		state.running = true;
		state.since = Date.now();
	}

	function questionOver() {
		return ( state.out[ 0 ] && state.out[ 1 ] ) || state.revealed >= ANSWERS_PER_QUESTION;
	}

	function nextQuestion() {
		// The ten answer fields ran out: whoever is still in keeps what they hold.
		state.names.forEach( function ( name, index ) {
			if ( ! state.out[ index ] ) {
				state.gained[ index ] += state.pots[ index ];
				state.totals[ index ] += state.pots[ index ];
				state.pots[ index ] = 0;
			}
		} );

		state.last = 'Frage ' + state.question + ' beendet · ' + state.names.map( function ( name, index ) {
			return name + ' +' + state.gained[ index ];
		} ).join( ' · ' );

		if ( state.question >= lastQuestion() ) {
			state.finished = true;
			return;
		}

		state.question += 1;
		state.starter = other( state.starter );
		startQuestion( state );
	}

	function undo() {
		if ( ! undoStack.length ) {
			return;
		}
		state = undoStack.pop();
		state.running = false;
		save();
		render();
	}

	function openNames( focusIndex ) {
		state.setup = true;
		save();
		render();

		var field = el.name[ focusIndex || 0 ];
		if ( field ) {
			field.focus();
			field.select();
		}
	}

	/** Nothing played yet, so the game length can still be changed. */
	function untouched() {
		return 1 === state.question && ! state.totals[ 0 ] && ! state.totals[ 1 ] && ! state.revealed;
	}

	/** Take the names from the name screen and go (back) to the game. */
	function applyNames() {
		checkpoint();
		state.names = el.name.map( function ( field, index ) {
			return field.value.trim() || 'Spieler ' + ( index + 1 );
		} );

		if ( untouched() ) {
			var chosen = el.mode.short.checked ? 'short' : 'long';
			if ( chosen !== state.mode ) {
				state.mode = chosen;
				startQuestion( state );
			}
		}

		state.setup = false;
		save();
		render();
	}

	function act( action ) {
		if ( 'undo' === action ) {
			undo();
			return;
		}

		if ( 'names' === action ) {
			openNames( 0 );
			return;
		}

		if ( 'start' === action ) {
			applyNames();
			return;
		}

		if ( 'again' === action ) {
			checkpoint();
			state = newGame( state.names, state.mode );
			save();
			render();
			return;
		}

		if ( 'clock' === action ) {
			startClock();
			save();
			render();
			return;
		}

		if ( 'reset' === action ) {
			if ( ! window.confirm( 'Neues Spiel starten? Alle Punkte werden zurückgesetzt.' ) ) {
				return;
			}
			checkpoint();
			state = newGame( state.names, state.mode );
			state.setup = true;
			save();
			render();
			return;
		}

		if ( state.finished ) {
			return;
		}

		checkpoint();
		stopClock();

		if ( 'correct' === action ) {
			correct();
		} else if ( 'wrong' === action ) {
			wrong();
		} else if ( 'pass' === action ) {
			stepOut();
		}

		finishTurn( state.question );
	}

	/**
	 * Wrap up a turn: end the question if nobody may answer any more, and hand
	 * the bonus-round clock to whoever is up next (18 c). A fresh question
	 * waits for the start button again.
	 *
	 * @param {number} question The question the turn belonged to.
	 */
	function finishTurn( question ) {
		if ( questionOver() ) {
			nextQuestion();
		}

		if ( state.question === question && ! state.finished ) {
			startClock();
		}

		save();
		render();
	}

	/** 18 (d): time up without an answer counts as stepping out. */
	function timeUp() {
		checkpoint();
		state.clocks[ state.active ] = 0;
		state.running = false;
		stepOut();
		finishTurn( state.question );
	}

	function tick() {
		if ( ! state || ! state.running ) {
			return;
		}

		if ( remaining( state.active ) <= 0 ) {
			timeUp();
			return;
		}

		el.times.forEach( function ( node, index ) {
			if ( node ) {
				node.textContent = seconds( remaining( index ) );
			}
		} );
	}

	/** Replay the banner animation, even if it is already running. */
	function flashRound() {
		el.last.classList.remove( 'zk-flash' );
		void el.last.offsetWidth;
		el.last.classList.add( 'zk-flash' );
	}

	function seconds( ms ) {
		return ( ms / 1000 ).toFixed( 1 );
	}

	function statusLabel( index ) {
		if ( ! state.out[ index ] ) {
			return state.active === index ? 'am Zug' : 'wartet';
		}
		if ( 'eliminated' === state.why[ index ] ) {
			return 'ausgeschieden';
		}
		if ( 'wrong' === state.why[ index ] ) {
			return 'Runde verloren';
		}
		if ( 'banked' === state.why[ index ] ) {
			return 'gesichert';
		}

		return 'ausgestiegen';
	}

	function points( n ) {
		return 1 === n ? '1 Punkt' : n + ' Punkte';
	}

	function cell( className, value, caption ) {
		var wrap = document.createElement( 'span' );
		wrap.className = className;

		var number = document.createElement( 'b' );
		number.textContent = value;

		var label = document.createElement( 'small' );
		label.textContent = caption;

		wrap.appendChild( number );
		wrap.appendChild( label );

		return wrap;
	}

	function renderPlayers() {
		el.players.innerHTML = '';
		el.times = [ null, null ];

		state.names.forEach( function ( name, index ) {
			var item = document.createElement( 'li' );
			item.className = 'zk-player';
			if ( state.active === index ) {
				item.classList.add( 'is-active' );
			}
			if ( state.out[ index ] ) {
				item.classList.add( 'is-out' );
			}
			if ( state.running && state.active === index ) {
				item.classList.add( 'is-ticking' );
			}

			var button = document.createElement( 'button' );
			button.type = 'button';
			button.className = 'zk-name';
			button.textContent = name;
			button.title = 'Namen ändern';
			button.addEventListener( 'click', function () {
				openNames( index );
			} );

			var numbers = document.createElement( 'span' );
			numbers.className = 'zk-numbers';
			numbers.appendChild( cell( 'zk-total', state.totals[ index ], 'gebankt' ) );
			numbers.appendChild( cell( 'zk-pot', state.pots[ index ], 'Runde' ) );

			if ( state.clocks ) {
				var clock = cell( 'zk-time', seconds( remaining( index ) ), 'Sek.' );
				el.times[ index ] = clock.firstChild;
				numbers.appendChild( clock );
			}

			var status = document.createElement( 'span' );
			status.className = 'zk-status';
			status.textContent = statusLabel( index );

			item.appendChild( button );
			item.appendChild( numbers );
			item.appendChild( status );
			el.players.appendChild( item );
		} );
	}

	function render() {
		el.setup.hidden = ! state.setup;
		el.game.hidden = !! state.setup;
		el.foot.hidden = !! state.setup;

		if ( state.setup ) {
			el.round.textContent = state.totals[ 0 ] || state.totals[ 1 ] ? 'Punkte bleiben erhalten' : '';
			el.name.forEach( function ( field, index ) {
				field.value = state.names[ index ];
			} );
			el.modes.hidden = ! untouched();
			el.mode.short.checked = 'short' === state.mode;
			el.mode.long.checked = 'short' !== state.mode;
			return;
		}

		var active = state.active;
		var pot = state.pots[ active ];
		var bonus = isBonus( state.question );

		var waiting = !! state.clocks && ! state.running && ! state.finished;

		el.actions.hidden = !! state.finished || waiting;
		el.start.hidden = ! waiting;
		el.turn.hidden = !! state.finished;
		el.over.hidden = ! state.finished;
		el.round.classList.toggle( 'zk-bonus', bonus && ! state.finished );

		renderPlayers();

		var eliminated = state.why.indexOf( 'eliminated' );
		var banner = ( state.last || '' ) + ( eliminated === -1 ? '' :
			( state.last ? ' · ' : '' ) + state.names[ eliminated ] +
			' ist uneinholbar hinten, scheidet aus und steht wieder bei 0' );

		el.last.textContent = banner;
		el.last.hidden = ! banner;

		if ( null !== shownQuestion && shownQuestion !== state.question && banner ) {
			flashRound();
		}
		shownQuestion = state.question;
		el.undo.disabled = ! undoStack.length;

		if ( state.finished ) {
			el.round.textContent = 'Spiel zu Ende nach ' + lastQuestion() + ' Fragen';
			el.winner.textContent = state.totals[ 0 ] === state.totals[ 1 ] ?
				'Unentschieden, ' + state.totals[ 0 ] + ' : ' + state.totals[ 1 ] :
				state.names[ state.totals[ 0 ] > state.totals[ 1 ] ? 0 : 1 ] + ' gewinnt';
			return;
		}

		el.round.textContent = 'Frage ' + state.question + '/' + lastQuestion() +
			( bonus ? ' · BONUS, doppelte Punkte' : '' ) +
			' · ' + state.revealed + '/' + ANSWERS_PER_QUESTION + ' aufgedeckt · ' +
			state.found + ' richtig';

		el.turn.textContent = 'Nächste richtige Antwort: ' + points( nextValue() );

		[ 'correct', 'wrong', 'pass' ].forEach( function ( action ) {
			el.who[ action ].textContent = state.names[ active ] + ': ';
		} );

		el.noteClock.textContent = state.names[ active ] + ': ' + seconds( remaining( active ) ) + ' Sek.';
		el.noteCorrect.textContent = '+' + nextValue();
		el.noteWrong.textContent = pot > 0 ? '−' + pot : 'Zug vorbei';
		el.notePass.textContent = pot > 0 ? pot + ' sichern' : 'ohne Punkte raus';
	}

	function init() {
		el.round = document.getElementById( 'zk-round' );
		el.setup = document.getElementById( 'zk-setup' );
		el.game = document.getElementById( 'zk-game' );
		el.foot = document.getElementById( 'zk-foot' );
		el.name = [ 0, 1 ].map( function ( index ) {
			return document.getElementById( 'zk-name-' + index );
		} );
		el.modes = document.getElementById( 'zk-modes' );
		el.mode = {
			short: document.getElementById( 'zk-mode-short' ),
			long: document.getElementById( 'zk-mode-long' )
		};
		el.players = document.getElementById( 'zk-players' );
		el.turn = document.getElementById( 'zk-turn' );
		el.actions = document.getElementById( 'zk-actions' );
		el.start = document.getElementById( 'zk-start' );
		el.noteClock = document.getElementById( 'zk-note-clock' );
		el.times = [ null, null ];
		el.last = document.getElementById( 'zk-last' );
		el.over = document.getElementById( 'zk-over' );
		el.winner = document.getElementById( 'zk-winner' );
		el.who = {
			correct: document.getElementById( 'zk-who-correct' ),
			wrong: document.getElementById( 'zk-who-wrong' ),
			pass: document.getElementById( 'zk-who-pass' )
		};
		el.noteCorrect = document.getElementById( 'zk-note-correct' );
		el.noteWrong = document.getElementById( 'zk-note-wrong' );
		el.notePass = document.getElementById( 'zk-note-pass' );
		el.undo = document.getElementById( 'zk-undo' );

		if ( ! el.players ) {
			return;
		}

		state = load();

		document.getElementById( 'zehnerkreis-app' ).addEventListener( 'click', function ( event ) {
			var button = event.target.closest( '[data-action]' );
			if ( button ) {
				act( button.getAttribute( 'data-action' ) );
			}
		} );

		el.last.addEventListener( 'animationend', function () {
			el.last.classList.remove( 'zk-flash' );
		} );

		el.name.forEach( function ( field, index ) {
			field.addEventListener( 'keydown', function ( event ) {
				if ( 'Enter' !== event.key ) {
					return;
				}
				event.preventDefault();
				if ( 0 === index && el.name[ 1 ] ) {
					el.name[ 1 ].focus();
					el.name[ 1 ].select();
				} else {
					applyNames();
				}
			} );
		} );

		window.setInterval( tick, TICK_MS );

		render();
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
}() );
