(function( ) {
	
	//RequestAnimationFrame
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(id) { clearTimeout(id); };	
	
var b 		 =  document.getElementById('board');
var c 		 =  b.getContext('2d');
var bg 		 =  document.getElementById('board-bg');
var cbg 	 =  bg.getContext('2d');
var combos 	 =  document.getElementById('combos');
var ctxcombo =  combos.getContext('2d');	
	
$(document).ready(function() {
	$("#board").height($("#board").width());
	$("#board-bg").height($("#board-bg").width());
	
	ball.src = "images/ball.png";
	ball.onload = init;
});

$(window).on( "resize", function() {
	$("#board").height($("#board").width());
	$("#board-bg").height($("#board-bg").width());
	scale = (p.gridSize + 4) * 60 / $("#board").height();
	
	c.clearRect(0, 0, b.height, b.width);
	cbg.clearRect(0, 0, b.height, b.width);
	
	p.drawBoard();
	p.drawBoardBalls();
});

$("#toggle-help").click(function() {	
	if (help) {		
		clearInterval(drain);		
		$("#help").hide(500);	
		p.enaclick = true;
	}
	else {
		gamestart = true;
		clearInterval(drain);
		$("#help").show(500);
		p.enaclick = false;	
	}
	help = !help;	
});



combos.width = 250;
combos.height = 60;

var colors = ['red', 'yellow', 'blue', 'green'];
var flatcolors = {
	'blue'		: 	'#4A89DC',
	'red'		:	'#ED5565',
	'yellow'	:	'#FFCE54',
	'green'		:	'#A0D468',
	'purple'	:	'#AC92EC'
}

var ball = new Image();
var m = new Array();
var colorcombo = new Array();
var downX, downY, upX, upY, drain, gamestart, gameover, p, touch, scale;
var touchX = 0, touchY = 0;

$("#board")
	.on('touchmove', function(e) {
		e.preventDefault();
	})	
	.on('touchstart', function(e) { 
		touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		downX = Math.floor((touch.pageX-$("#board").offset().left) * scale / 60);
		downY = Math.floor((touch.pageY-$("#board").offset().top) * scale / 60);
	})
	.on('touchend', function(e) {
		touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
		upX = Math.floor((touch.pageX-$("#board").offset().left) * scale / 60);
		upY = Math.floor((touch.pageY-$("#board").offset().top) * scale / 60);
		p.handleClick();
	})
	.on('mousedown', function(e) {
		
		if (!touch) {
			if (e.offsetX) {
				downX = Math.floor(e.offsetX * scale / 60);
				downY = Math.floor(e.offsetY * scale / 60);
			} else if (e.offsetX == undefined) {	//Firefox
				downX = Math.floor((e.pageX-$('#board').offset().left) / 60) +1;
				downY = Math.floor((e.pageY-$('#board').offset().top) / 60);
			}
		}
	})
	.on('mouseup', function(e) {
		if (!touch) {
			if (e.offsetX) {
				upX = Math.floor(e.offsetX * scale / 60);
				upY = Math.floor(e.offsetY * scale / 60);
			} else if (e.offsetX == undefined) {	//Firefox
				upX = Math.floor((e.pageX-$('#board').offset().left) / 60);
				upY = Math.floor((e.pageY-$('#board').offset().top) / 60);
			}
			p.handleClick();			
		}
	});
	
function render() {
	if (!gameover && !gamestart) {	
		c.clearRect(0, 0, b.height, b.width);
		p.drawBoardBalls();	
		window.requestAnimationFrame(render);	
	}	
}
function init() {
	p = new Collider(10);
	
	gamestart = true;
	gameover = false;
	help = false;
	bg.width = bg.height = b.height = b.width = (p.gridSize + 4) * 60;
	$("#hp").css("width","100%").removeClass( "progress-bar-danger progress-bar-warning" ).addClass( "progress-bar-success" );
	scale = (p.gridSize + 4) * 60 / $("#board").height();	
			
    p.drawBoard();
    p.initBorderBalls();
	p.initBoardBalls();
	p.drawBoardBalls();
}
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function hpDrain() {
    if (p.hp > 0) {
        p.hp -= 1 + 0.5 * Math.floor(p.points / 5000);
		$("#hp").css("width",p.hp+"%");
        if (p.hp <= 30 && $("#hp").hasClass("progress-bar-danger")) {			
            $("#hp").removeClass( "progress-bar-warning progress-bar-success" ).addClass( "progress-bar-danger" );
        } 
		else if (p.hp > 30 && p.hp <= 60 && $("#hp").hasClass("progress-bar-warning")) {
            $("#hp").removeClass( "progress-bar-danger progress-bar-success" ).addClass( "progress-bar-warning" );
        }
		else if (p.hp > 60 && $("#hp").hasClass("progress-bar-success")) {
			$("#hp").removeClass( "progress-bar-danger progress-bar-warning" ).addClass( "progress-bar-success" );
		}
    } else {
		p.GameOver();
    }
    p.checkGameOver();
}

$("#newgame").click(function () {
    $("#newgame-popup").hide(500);
	p.points = 0;
    init();	
});

function Collider(gridsize) {
    this.gridSize = gridsize;
    this.points = 0;
    this.hp = 100;
    this.combo = 0;
    this.enaclick = true;
    this.speed = gridsize + 5;
    this.fps = 60;

	this.GameOver = function () {
		$("#newgame-popup").show(500);
		gameover = true;
		this.enaclick = false;
		clearInterval(drain);
		window.cancelAnimationFrame(render);
	}

	this.spawn = function () {
		this.enaclick = false;
		var x = rand(3, this.gridSize - 2);
		var y = rand(3, this.gridSize - 2); 		
		while (m[x][y].color != 'transparent') {
			x = rand(3, this.gridSize - 2);
			y = rand(3, this.gridSize - 2);
		}

		m[x][y].set(colors[Math.floor((Math.random() * colors.length))], 30 + x * 60, 30 + y * 60);
		m[x][y].r = 30;
		
		this.checkCombo();	
	}

	this.checkGameOver = function () {
		var i,j,t = 0;

		//Ha üres a pálya
		for (i = 2; i <= this.gridSize + 1; i++)
			for (j = 2; j <= this.gridSize + 1; j++)
				if (m[i][j].color == 'transparent')
					t++;
						   
		if (t == this.gridSize * this.gridSize) {
			this.points += this.hp * 100;
			this.initBoardBalls();
		}
		
		//Ha nincs több lehetőség  
		t = 0;
		for (i = 2; i < this.gridSize + 1; i++) {
			if (m[i][2].color == 'transparent') t++;        
			if (m[i][this.gridSize + 1].color == 'transparent') t++;     
			if (m[2][i].color == 'transparent') t++;        
			if (m[this.gridSize + 1][i].color == 'transparent') t++;   	
		}
		if (t == 0) this.GameOver();
	}
	this.drawBoardBalls = function () {
		for (var i = 0; i < this.gridSize + 4; i++) {
			for (var j = 0; j < this.gridSize + 4; j++) {
				if (m[i][j].color != 'transparent') {				
					if (m[i][j].s) m[i][j].shrink(i, j);
					if (m[i][j].d != "") m[i][j].move();
					m[i][j].draw();
				}
			}
		}
	}
	this.initBorderBalls = function () {
		var i, j;
		for (i = 0; i < this.gridSize + 4; i++) {
			m[i] = new Array();
			for (j = 0; j < this.gridSize + 4; j++) {
				m[i].push(new Ball());
			}
		}
		for (i = 0; i < this.gridSize; i++) {
			m[i + 2][1].set(colors[Math.floor((Math.random() * colors.length))], 30 + (i + 2) * 60, 90);
			m[i + 2][0].set(colors[Math.floor((Math.random() * colors.length))], 30 + (i + 2) * 60, 30);
			m[this.gridSize + 2][i + 2].set(colors[Math.floor((Math.random() * colors.length))], 30 + (this.gridSize + 2) * 60, 30 + (i + 2) * 60);
			m[this.gridSize + 3][i + 2].set(colors[Math.floor((Math.random() * colors.length))], 30 + (this.gridSize + 3) * 60, 30 + (i + 2) * 60);
		}
		for (i = this.gridSize; i > 0; i--) {
			m[i + 1][this.gridSize + 2].set(colors[Math.floor((Math.random() * colors.length))], 30 + (i + 1) * 60, 30 + (this.gridSize + 2) * 60);
			m[i + 1][this.gridSize + 3].set(colors[Math.floor((Math.random() * colors.length))], 30 + (i + 1) * 60, 30 + (this.gridSize + 3) * 60);
			m[1][i + 1].set(colors[Math.floor((Math.random() * colors.length))], 90, 30 + (i + 1) * 60);
			m[0][i + 1].set(colors[Math.floor((Math.random() * colors.length))], 30, 30 + (i + 1) * 60);
		}    
	}
	this.initBoardBalls = function() {
		for (var i = 0; i < this.gridSize; i++) {
			this.spawn();
		}
		this.enaclick = true;
	}
	this.checkNB = function (x, y) {
		var color = m[x][y].color;
		m[x][y].color = 'transparent';
		m[x][y].s = false;
		if (y > 2) {
			if (m[x][y - 1].color == color) {
				m[x][y - 1].s = true;
			}
		}
		if (y < this.gridSize + 1) {
			if (m[x][y + 1].color == color) {
				m[x][y + 1].s = true;
			}
		}
		if (x > 2) {
			if (m[x - 1][y].color == color) {
				m[x - 1][y].s = true;
			}
		}
		if (x < this.gridSize + 1) {
			if (m[x + 1][y].color == color) {
				m[x + 1][y].s = true;
			}
		}
		this.combo++;
		if (this.combo >= 3) {
			this.points += 100 + (this.combo - 3) * 50;
			this.hp = this.hp + 1 + (1 * Math.floor(this.gridSize / 5));
			this.hp = this.hp > 100 ? 100 : this.hp;
		}
		$("#points").html(this.points);
	}
	this.drawCombo = function () {
		ctxcombo.clearRect(0, 0, bg.height, bg.width);	
		ctxcombo.fillStyle = flatcolors[colorcombo[0]];
		for (var i = 0; i < colorcombo.length; i++) {  
			ctxcombo.beginPath();
			ctxcombo.arc(30 + i * 60, 30, 25, 0, 2 * Math.PI, false);			
			ctxcombo.fill();
			ctxcombo.drawImage(ball, i * 60, 0, 60, 60);
		}
	}
	this.checkColorCombo = function () {
		if (colorcombo.length == 3) {
			if (colorcombo[0] == colorcombo[1] && colorcombo[1] == colorcombo[2]) {
				if (colorcombo[0] == 'red')
					this.hp = this.hp < 90 ? this.hp += 10 : this.hp = 100;
				
				if (colorcombo[0] == 'blue') {
					for (var x = 2; x < this.gridSize + 1; x++) {
						for (var y = 2; y < this.gridSize + 1; y++) {
							if (m[x][y].color == 'blue') {
								this.points += 100;
								m[x][y].s = true;
							}
						}
					}
					this.checkGameOver();
				}
				
				if (colorcombo[0] == 'yellow') {
					for (var i = 2; i < this.gridSize + 1; i++) {
						m[i][0].color = 'yellow';
						m[i][this.gridSize + 3].color = 'yellow';
						m[0][i].color = 'yellow';
						m[this.gridSize + 3][i].color = 'yellow';
					}
				}
				if (colorcombo[0] == 'green') {
					for (var x = 2; x < this.gridSize + 1; x++) 
						for (var y = 2; y < this.gridSize + 1; y++) 
							m[x][y].r = 30;
				}
				
				colorcombo = [];
			}
			else if (colorcombo[1] != colorcombo[2]) {
				var nc = colorcombo[2];
				colorcombo = [];
				colorcombo.push(nc);			
			}		
		}
		if (colorcombo.length == 2) {
			if (colorcombo[0] != colorcombo[1]) {
				var nc = colorcombo[1];
				colorcombo = [];
				colorcombo.push(nc);
			}
		}
	}
	this.checkCombo = function () {    
		this.combo = 0;
		//Vízszintes
		for (var y = 2; y < this.gridSize + 2; y++) {
			var combo = 1;
			for (var x = 2; x < this.gridSize + 1; x++) {
				if (m[x][y].color == m[x + 1][y].color && m[x][y].color != 'transparent') {
					combo++;
				} else {
					combo = 1;
				}
				if (combo == 3) {
					m[x][y].s = true;
					colorcombo.push(m[x][y].color);
					this.checkColorCombo();
					this.drawCombo();
				}
			}
		}
		//Függőleges
		for (var x = 2; x < this.gridSize + 2; x++) {
			var combo = 1;
			for (var y = 2; y < this.gridSize + 1; y++) {
				if (m[x][y].color == m[x][y + 1].color && m[x][y].color != 'transparent') {
					combo++;
				} else {
					combo = 1;
				}
				if (combo == 3) {
					m[x][y].s = true;
					colorcombo.push(m[x][y].color);
					this.checkColorCombo();
					this.drawCombo();
				}
			}
		}	
	}
	
	this.drawBoard = function () {
		cbg.beginPath();
		cbg.lineWidth = 1;
		cbg.strokeStyle = "black";
		for (var i = 2; i < this.gridSize + 3; i++) {        
			cbg.moveTo(i * 60, 0);
			cbg.lineTo(i * 60, (this.gridSize + 4) * 60);
			cbg.moveTo(0, i * 60);
			cbg.lineTo((this.gridSize + 4) * 60, i * 60);     
		}
		cbg.rect(120, 120, this.gridSize * 60, this.gridSize * 60);
		cbg.stroke();
	}

	this.handleClick = function () {
		if (gamestart && this.enaclick) {
			drain = setInterval(hpDrain, 1000);
			gamestart = false;
			render();
		}
		
		if (this.enaclick) {
			var i;	
			//Játékmezőn
			if (downY > 1 && downY < this.gridSize + 2 && downX > 1 && downX < this.gridSize + 2) {
				
				//Fel
				if (downX == upX && downY > upY && m[downX][downY].r == 30 && m[downX][downY - 1].color == 'transparent') {
					i = downY - 1;
					while (m[downX][i].color == 'transparent') {
						i--;
					}	
					if (i >= 2 && i < this.gridSize + 1) {					
						m[downX][downY].d = "up";
						m[downX][downY].dx = 30 + 60 * downX;
						m[downX][downY].dy = 30 + 60 * (i + 1);
						m[downX][downY].r = 22;					
						this.enaclick = false;
					}				
				}
				
				//Le
				if (downX == upX && downY < upY && m[downX][downY].r == 30 && m[downX][downY + 1].color == 'transparent') {
					i = downY + 1;
					while (m[downX][i].color == 'transparent') {
						i++
					}
					if (i > 2 && i < this.gridSize + 2) {
						m[downX][downY].d = "down";
						m[downX][downY].dx = 30 + 60 * downX;
						m[downX][downY].dy = 30 + 60 * (i - 1);
						m[downX][downY].r = 22;	
						this.enaclick = false;
					}			
				}
				
				//Jobb
				if (downX < upX && downY == upY && m[downX][downY].r == 30 && m[downX + 1][downY].color == 'transparent') {
					i = downX + 1;
					while (m[i][downY].color == 'transparent') {
						i++
					}
					if (i > 2 && i < this.gridSize + 2) {
						m[downX][downY].d = "right";
						m[downX][downY].dx = 30 + 60 * (i - 1);
						m[downX][downY].dy = 30 + 60 * downY;
						m[downX][downY].r = 22;	
						this.enaclick = false;
					}
				}
				
				//Bal
				if (downX > upX && downY == upY  && m[downX][downY].r == 30 && m[downX - 1][downY].color == 'transparent') {
					i = downX - 1;
					while (m[i][downY].color == 'transparent') {
						i--
					}
					if (i >= 2 && i < this.gridSize + 1) {
						m[downX][downY].d = "left";
						m[downX][downY].dx = 30 + 60 * (i + 1);
						m[downX][downY].dy = 30 + 60 * downY;
						m[downX][downY].r = 22;	
						this.enaclick = false;
					}
				}		
			}
			
			else {						
				//Szélek	
				
				//Felső
				if (downY == 1) {
					i = 2;
					while (m[downX][i].color == 'transparent') {
						i++
					}
					if (i > 2 && i < this.gridSize + 2) {
						m[downX][downY].d = "down";
						m[downX][downY].dx = 30 + 60 * downX;
						m[downX][downY].dy = 30 + 60 * (i - 1);
						this.enaclick = false;
					}
				}
				//Alsó
				if (downY == this.gridSize + 2) {
					i = this.gridSize + 1;
					while (m[downX][i].color == 'transparent') {
						i--
					}
					if (i >= 2 && i < this.gridSize + 1) {
						m[downX][downY].d = "up";
						m[downX][downY].dx = 30 + 60 * downX;
						m[downX][downY].dy = 30 + 60 * (i + 1);
						this.enaclick = false;
					}
				}
				//Bal
				if (downX == 1) {
					i = 2;
					while (m[i][downY].color == 'transparent') {
						i++
					}
					if (i > 2 && i < this.gridSize + 2) {
						m[downX][downY].d = "right";
						m[downX][downY].dx = 30 + 60 * (i - 1);
						m[downX][downY].dy = 30 + 60 * downY;
						this.enaclick = false;
					}
				}
				//Jobb
				if (downX == this.gridSize + 2) {
					i = this.gridSize + 1;
					while (m[i][downY].color == 'transparent') {
						i--
					}
					if (i >= 2 && i < this.gridSize + 1) {
						m[downX][downY].d = "left";
						m[downX][downY].dx = 30 + 60 * (i + 1);
						m[downX][downY].dy = 30 + 60 * downY;
						this.enaclick = false;
					}
				}
			}
			
		}
	}
}

function Ball() {
    this.color = 'transparent';
    this.s = false;
    this.r = 30;
    this.cx = 0;
    this.cy = 0;
    this.d = "";
    this.dx = 0;
    this.dy = 0;
}
Ball.prototype.draw = function () {
    if (this.r > 3) {
        c.beginPath();
        c.arc(this.cx, this.cy, this.r-3, 0, 2 * Math.PI, false);
        c.fillStyle = flatcolors[this.color];
        c.fill();
        c.drawImage(ball, this.cx - this.r, this.cy - this.r, this.r * 2, this.r * 2);
    }
}
Ball.prototype.set = function (color, cx, cy) {
	this.color = color;
    this.cx = cx
    this.cy = cy;
}
Ball.prototype.shrink = function (x, y) {	
    if (this.s) {
        this.enaclick = false;
        if (this.r > 3) {
            this.r -= 4;
        } else {
			this.r = 3;
            p.checkNB(x, y);		
        }
    }
}
Ball.prototype.move = function () {
    var x = (this.dx - 30) / 60;
	var y = (this.dy - 30) / 60;
    switch (this.d) {		
		case "left":
			if (this.cx > this.dx) {
				this.cx = this.cx - p.speed > this.dx ? this.cx - p.speed : this.dx;
			} else {		
				m[x][y].color = this.color;
				m[x][y].cx = this.dx;
				m[x][y].cy = this.dy;
				m[x][y].r = this.r;
				
				this.d = "";
				this.color = 'transparent';
				
				if (downX == p.gridSize + 2) {				
					m[p.gridSize + 2][y].color = m[p.gridSize + 3][y].color;
					m[p.gridSize + 2][y].cx = 30 + 60 * (p.gridSize + 2);
					m[p.gridSize + 2][y].cy = 30 + 60 * y;
					m[p.gridSize + 3][y].color = colors[Math.floor((Math.random() * colors.length))];
				}
				
				p.enaclick = true;
				p.checkCombo();
				
			}
			break;
		case "right":
			if (this.cx < this.dx) {				
				this.cx = this.cx + p.speed < this.dx ? this.cx + p.speed : this.dx;
			} else {				
				m[x][y].color = this.color;
				m[x][y].cx = this.dx;
				m[x][y].cy = this.dy;
				m[x][y].r = this.r;
				
				this.d = "";
				this.color = 'transparent';
				
				if (downX == 1) {
					m[1][y].color = m[0][y].color;
					m[1][y].cx = 90;
					m[1][y].cy = 30 + 60 * y;
					m[0][y].color = colors[Math.floor((Math.random() * colors.length))];
				}
				
				p.enaclick = true;
				p.checkCombo();
				
			}
			break;
		case "up":
			if (this.cy > this.dy) {
				this.cy = this.cy - p.speed > this.dy ? this.cy - p.speed : this.dy;
			} else {
				m[x][y].color = this.color;
				m[x][y].cx = this.dx;
				m[x][y].cy = this.dy;
				m[x][y].r = this.r;
				
				this.d = "";
				this.color = 'transparent';
								
				if (downY == p.gridSize + 2) {
					m[x][p.gridSize + 2].color = m[x][p.gridSize + 3].color;
					m[x][p.gridSize + 2].cx = 30 + 60 * x;
					m[x][p.gridSize + 2].cy = 30 + 60 * (p.gridSize + 2);
					m[x][p.gridSize + 3].color = colors[Math.floor((Math.random() * colors.length))];
				}
				
				p.enaclick = true;
				p.checkCombo();
				
			}
			break;
		case "down":
			if (this.cy < this.dy) {
				this.cy = this.cy + p.speed < this.dy ? this.cy + p.speed : this.dy;
			} else {
				m[x][y].color = this.color;
				m[x][y].cx = this.dx;
				m[x][y].cy = this.dy;
				m[x][y].r = this.r;
				
				this.d = "";
				this.color = 'transparent';				
				
				if (downY == 1) {
					m[x][1].color = m[x][0].color;
					m[x][1].cx = 30 + 60 * x;
					m[x][1].cy = 90;
					m[x][0].color = colors[Math.floor((Math.random() * colors.length))];
				}
				
				p.enaclick = true;
				p.checkCombo();
				
			}
			break;
    }
	
}
}());