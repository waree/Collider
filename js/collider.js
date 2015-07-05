(function() {

    //  var b = document.getElementById('board');
    var bg = document.getElementById('board-bg');
    var game = document.getElementById('layers');
    var cbg = bg.getContext('2d');
    var colors = ['red', 'yellow', 'blue', 'green'];
    var flatcolors = {
        'blue': '#4A89DC',
        'red': '#ED5565',
        'yellow': '#FFCE54',
        'green': '#A0D468',
        'purple': '#AC92EC'
    }

    var colorcombo = new Array();
    var downX, downY, upX, upY, drain, gamestop, gameover, p, touch, scale, m, bwidth, scale;

    var bc = $("#ball-container");
    var hp = $("#hp");
    var wrapper = $("#wrapper");
    var combos = $("#combos");

    function gScale() {
      //$("#points").html($(window).height());
      var w = cbg.canvas.clientWidth;
      bc.width(w);
      bc.height(bc.width());
      scale = w * (14 / (p.gridSize + 4)) / 700;

      bc.css("transform","scale(" + scale + ")");
      bc.css("-webkit-transform","scale(" + scale + ")");
      bc.css("-moz-transform","scale(" + scale + ")");
      bc.css("-ms-transform","scale(" + scale + ")");
      bc.css("-o-transform","scale(" + scale + ")");
    }

    $(document).ready(function() {
      init();
      gScale();
    });

    $(window).on("resize", function() {
      p.clearBG();
      p.drawBoard();
      gScale();
    });

    $("#toggle-help").click(function() {
        $("#help").toggleClass("show");
        if (help) {
            p.enaclick = true;
        } else {
            gamestop = true;
            clearInterval(drain);
            p.enaclick = false;
        }
        help = !help;
    });

    $("#board-bg, #ball-container, .ball").on('touchmove', function(e) {
        e.preventDefault();
    }).on('touchstart', function(e) {
        if (p.enaclick) {
            touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            downX = Math.floor((touch.pageX - bc.offset().left) / 50 / scale);
            downY = Math.floor((touch.pageY - bc.offset().top) / 50 / scale);
        }
    }).on('touchend', function(e) {
        if (p.enaclick) {
            touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            upX = Math.floor((touch.pageX - bc.offset().left) / 50 / scale);
            upY = Math.floor((touch.pageY - bc.offset().top) / 50 / scale);
            p.handleClick();
        }
    }).on('mousedown', function(e) {
        if (!touch && p.enaclick) {
            downX = Math.floor((e.pageX - bc.offset().left) / 50 / scale);
            downY = Math.floor((e.pageY - bc.offset().top) / 50 / scale);
            console.log(downX,downY)
        }
    }).on('mouseup', function(e) {
        if (!touch && p.enaclick) {
            upX = Math.floor((e.pageX - bc.offset().left) / 50 / scale);
            upY = Math.floor((e.pageY - bc.offset().top) / 50 / scale);
            p.handleClick();
        }
    });

    function init() {
        p = new Collider($("#board-bg").width() < 400 ? 6 : 10);
        gamestop = true;
        gameover = help = false;

        bg.width = bg.height = 700;
        bwidth = Math.floor(bg.width / (p.gridSize + 4));
        hp.css("width", "100%").removeClass("progress-bar-danger progress-bar-warning").addClass("progress-bar-success");
        colorcombo = [];

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
            p.hp -= 1;
            hp.css("width", p.hp + "%");
            if (p.hp <= 30 && hp.hasClass("progress-bar-danger")) hp.removeClass("progress-bar-warning progress-bar-success").addClass("progress-bar-danger");
            else if (p.hp > 30 && p.hp <= 60 && hp.hasClass("progress-bar-warning")) hp.removeClass("progress-bar-danger progress-bar-success").addClass("progress-bar-warning");
            else if (p.hp > 60 && hp.hasClass("progress-bar-success")) hp.removeClass("progress-bar-danger progress-bar-warning").addClass("progress-bar-success");
        } else {
            p.GameOver();
            return;
        }
        p.checkGameOver();
    }

    $("#newgame").click(function() {
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
        this.fps = 60;
    }

    Collider.prototype.clearBG = function() {
        cbg.clearRect(0, 0, bg.height, bg.width);
    }

    Collider.prototype.GameOver = function() {
        $("#newgame-popup").show(500);
        gameover = true;
        this.enaclick = false;
        clearInterval(drain);
    }

    Collider.prototype.spawn = function() {
        var x = rand(3, this.gridSize);
        var y = rand(3, this.gridSize);
        while (m[x][y].color != 'transparent') {
            x = rand(3, this.gridSize);
            y = rand(3, this.gridSize);
        }
        m[x][y].set(colors[Math.floor((Math.random() * colors.length))], x * 50, y * 50);
        m[x][y].r = 1;
    }

    Collider.prototype.checkGameOver = function() {
        var i, j, t = 0;

        //Ha üres a pálya
        for (i = 2; i <= this.gridSize + 1; i++)
            for (j = 2; j <= this.gridSize + 1; j++)
                if (m[i][j].color == 'transparent') t++;

        if (t == this.gridSize * this.gridSize) {
            this.points += this.hp * 100;
            this.hp = 100;
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

    Collider.prototype.drawBoardBalls = function() {
        for (var i = 0; i < this.gridSize + 4; i++)
            for (var j = 0; j < this.gridSize + 4; j++)
                if (m[i][j].color != 'transparent') {
                    if (m[i][j].s) m[i][j].shrink(i, j);
                    m[i][j].draw();
                }
    }

    Collider.prototype.initBorderBalls = function() {
        var i, j;
        m = new Array(this.gridSize + 4);
        for (i = 0; i < this.gridSize + 4; i++) {
            m[i] = new Array(this.gridSize + 4);
            for (j = 0; j < this.gridSize + 4; j++) {
                m[i][j] = new Ball();
            }
        }
        for (i = 0; i < this.gridSize; i++) {
            m[i + 2][1].set(colors[Math.floor((Math.random() * colors.length))], (i + 2) * 50, 50);
            m[i + 2][0].set(colors[Math.floor((Math.random() * colors.length))], (i + 2) * 50, 0);
            m[i + 2][this.gridSize + 2].set(colors[Math.floor((Math.random() * colors.length))], (i + 2) * 50, (this.gridSize + 2) * 50);
            m[i + 2][this.gridSize + 3].set(colors[Math.floor((Math.random() * colors.length))], (i + 2) * 50, (this.gridSize + 3) * 50);
            m[this.gridSize + 2][i + 2].set(colors[Math.floor((Math.random() * colors.length))], (this.gridSize + 2) * 50, (i + 2) * 50);
            m[this.gridSize + 3][i + 2].set(colors[Math.floor((Math.random() * colors.length))], (this.gridSize + 3) * 50, (i + 2) * 50);
            m[1][i + 2].set(colors[Math.floor((Math.random() * colors.length))], 50, (i + 2) * 50);
            m[0][i + 2].set(colors[Math.floor((Math.random() * colors.length))], 0, (i + 2) * 50);
        }
    }

    Collider.prototype.initBoardBalls = function() {
        for (var i = 0; i < this.gridSize; i++)
            this.spawn();
    }

    Collider.prototype.checkNB = function(ball) {
        var x = (parseInt(ball.div.style.left) + ball.tx) / 50;
        var y = (parseInt(ball.div.style.top) + ball.ty) / 50;

        var color = m[x][y].color;
        m[x][y].color = 'transparent';
        m[x][y].shrink(0);

        if (y > 2 && m[x][y - 1].color == color) this.checkNB(m[x][y - 1]);
        if (y < this.gridSize + 1 && m[x][y + 1].color == color) this.checkNB(m[x][y + 1]);
        if (x > 2 && m[x - 1][y].color == color) this.checkNB(m[x - 1][y]);
        if (x < this.gridSize + 1 && m[x + 1][y].color == color) this.checkNB(m[x + 1][y]);

        this.combo++;
        if (this.combo >= 3) {
            this.points += 100 + (this.combo - 3) * 50;
            this.hp = this.hp + 1 + (1 * Math.floor(this.gridSize / 5));
            this.hp = this.hp > 100 ? 100 : this.hp;
        }
        $("#points").html(this.points);
    }

    Collider.prototype.drawCombo = function() {
        var div = document.createElement('div');
        combos.html("");
        for (var i = 0; i < colorcombo.length; i++) {
            combos.append('<div class="ball ' + colorcombo[i] + '"></div>');
        }
    }

    Collider.prototype.checkColorCombo = function() {
        if (colorcombo.length == 3) {
            if (colorcombo[0] == colorcombo[1] && colorcombo[1] == colorcombo[2]) {
                if (colorcombo[0] == 'red') this.hp = this.hp < 90 ? this.hp += 10 : this.hp = 100;

                if (colorcombo[0] == 'blue') {
                    for (var x = 2; x < this.gridSize + 1; x++)
                        for (var y = 2; y < this.gridSize + 1; y++)
                            if (m[x][y].color == 'blue') {
                                this.points += 100;
                                m[x][y].shrink(0);
                            }
                    this.checkGameOver();
                }

                if (colorcombo[0] == 'yellow') {
                    for (var i = 2; i < this.gridSize + 2; i++) {
                        m[i][0].color = 'yellow';
                        m[i][0].div.className = "ball yellow";
                        m[i][this.gridSize + 3].color = 'yellow';
                        m[i][this.gridSize + 3].div.className = "ball yellow";
                        m[0][i].color = 'yellow';
                        m[0][i].div.className = "ball yellow";
                        m[this.gridSize + 3][i].color = 'yellow';
                        m[this.gridSize + 3][i].div.className = "ball yellow";
                    }
                }

                if (colorcombo[0] == 'green') {
                    for (var x = 2; x < this.gridSize + 1; x++)
                        for (var y = 2; y < this.gridSize + 1; y++)
                            m[x][y].shrink(1);
                }
                colorcombo = [];
            } else if (colorcombo[1] != colorcombo[2]) {
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

    Collider.prototype.checkCombo = function() {
        this.combo = 0;
        var combo = 1;
        var x, y;
        //Vízszintes
        for (y = 2; y < this.gridSize + 2; y++) {
            for (x = 2; x < this.gridSize + 1; x++) {
                if (m[x][y].color == m[x + 1][y].color && m[x][y].color != 'transparent') combo++;
                else combo = 1;
                if (combo == 3) {
                    colorcombo.push(m[x][y].color);
                    this.checkNB(m[x][y]);
                    this.checkColorCombo();
                    this.drawCombo();
                }
            }
        }
        //Függőleges
        for (x = 2; x < this.gridSize + 2; x++) {
            for (y = 2; y < this.gridSize + 1; y++) {
                if (m[x][y].color == m[x][y + 1].color && m[x][y].color != 'transparent') combo++;
                else combo = 1;
                if (combo == 3) {
                    colorcombo.push(m[x][y].color);
                    this.checkNB(m[x][y]);
                    this.checkColorCombo();
                    this.drawCombo();
                }
            }
        }
    }

    Collider.prototype.drawBoard = function() {
        cbg.beginPath();
        cbg.lineWidth = 1;
        cbg.strokeStyle = "black";
        for (var i = 2; i < this.gridSize + 3; i++) {
            cbg.moveTo(Math.floor(14 / (this.gridSize + 4) * i * 50), 0);
            cbg.lineTo(Math.floor(14 / (this.gridSize + 4) * i * 50), Math.floor(14 / (this.gridSize + 4) * (this.gridSize + 4) * 50));
            cbg.moveTo(0, Math.floor(14 / (this.gridSize + 4) * i * 50));
            cbg.lineTo(Math.floor(14 / (this.gridSize + 4) * (this.gridSize + 4) * 50), Math.floor(14 / (this.gridSize + 4) * i * 50));
        }
        cbg.rect(Math.floor(14 / (this.gridSize + 4)*100), Math.floor(14 / (this.gridSize + 4)*100), Math.floor(14 / (this.gridSize + 4) * this.gridSize * 50), Math.floor(14 / (this.gridSize + 4) * this.gridSize * 50));
        cbg.stroke();
    }

    Collider.prototype.handleClick = function() {
        if (gamestop) {
            drain = setInterval(hpDrain, 1000);
            gamestop = false;
        }
        //Játékmezőn
        if (m[downX][downY].color != 'transparent') {
            var i;
            if (downY > 1 && downY < this.gridSize + 2 && downX > 1 && downX < this.gridSize + 2) {
                //Fel
                if (downX == upX && downY > upY && m[downX][downY].r == 1 && m[downX][downY - 1].color == 'transparent') {
                    i = downY - 1;
                    while (m[downX][i--].color == 'transparent') {}
                    if (i >= 2 && i < this.gridSize + 1) {
                        this.enaclick = false;
                        m[downX][downY].translate(0, -50 * (downY - i - 2));
                        m[downX][downY].shrink(0.7);
                        m[downX][i + 2] = m[downX][downY];
                        m[downX][downY] = new Ball();
                        setTimeout(function() {
                            p.enaclick = true;
                        }, 400);
                    }
                    //Le
                } else if (downX == upX && downY < upY && m[downX][downY].r == 1 && m[downX][downY + 1].color == 'transparent') {
                    i = downY + 1;
                    while (m[downX][i++].color == 'transparent') {}
                    if (i > 2 && i < this.gridSize + 2) {
                        this.enaclick = false;
                        m[downX][downY].translate(0, 50 * (i - 2 - downY));
                        m[downX][downY].shrink(0.7);
                        m[downX][i - 2] = m[downX][downY];
                        m[downX][downY] = new Ball();
                        setTimeout(function() {
                            p.enaclick = true;
                        }, 400);
                    }
                    //Jobb
                } else if (downX < upX && downY == upY && m[downX][downY].r == 1 && m[downX + 1][downY].color == 'transparent') {
                    i = downX + 1;
                    while (m[i++][downY].color == 'transparent') {}
                    if (i > 2 && i < this.gridSize + 2) {
                        this.enaclick = false;
                        m[downX][downY].translate(50 * (i - 2 - downX), 0);
                        m[downX][downY].shrink(0.7);
                        m[i - 2][downY] = m[downX][downY];
                        m[downX][downY] = new Ball();
                        setTimeout(function() {
                            p.enaclick = true;
                        }, 400);
                    }
                    //Bal
                } else if (downX > upX && downY == upY && m[downX][downY].r == 1 && m[downX - 1][downY].color == 'transparent') {
                    i = downX - 1;
                    while (m[i--][downY].color == 'transparent') {}
                    if (i >= 2 && i < this.gridSize + 1) {
                        this.enaclick = false;
                        m[downX][downY].translate(-50 * (downX - i - 2), 0);
                        m[downX][downY].shrink(0.7);
                        m[i + 2][downY] = m[downX][downY];
                        m[downX][downY] = new Ball();
                        setTimeout(function() {
                            p.enaclick = true;
                        }, 400);
                    }
                }
            }
            //Szélek
            else {
                //Felső
                if (downY == 1 && m[downX][2].color == 'transparent') {
                    i = 2;
                    while (m[downX][i].color == 'transparent') i++;
                    if (i > 2 && i < this.gridSize + 2) {
                        this.enaclick = false;
                        m[downX][downY].translate(0, 50 * (i - 2));
                        m[downX][downY - 1].translate(0, 50);
                        m[downX][i - 1] = m[downX][downY];
                        m[downX][downY] = m[downX][downY - 1];
                        m[downX][downY - 1] = new Ball();
                        m[downX][downY - 1].set(colors[Math.floor((Math.random() * colors.length))], downX * 50, (downY - 1) * 50);
                        setTimeout(function() {
                            m[downX][downY - 1].draw();
                            p.enaclick = true;
                        }, 400);
                    }
                }
                //Alsó
                else if (downY == this.gridSize + 2 && m[downX][this.gridSize + 1].color == 'transparent') {
                    i = this.gridSize + 1;
                    while (m[downX][i].color == 'transparent') i--;
                    if (i >= 2 && i < this.gridSize + 1) {
                        this.enaclick = false;
                        m[downX][downY].translate(0, -50 * (this.gridSize - (i - 1)));
                        m[downX][downY + 1].translate(0, -50);
                        m[downX][i + 1] = m[downX][downY];
                        m[downX][downY] = m[downX][downY + 1];
                        m[downX][downY + 1] = new Ball();
                        m[downX][downY + 1].set(colors[Math.floor((Math.random() * colors.length))], downX * 50, (downY + 1) * 50);
                        setTimeout(function() {
                            m[downX][downY + 1].draw();
                            p.enaclick = true;
                        }, 400);
                    }
                }
                //Bal
                else if (downX == 1 && m[2][downY].color == 'transparent') {
                    i = 2;
                    while (m[i][downY].color == 'transparent') i++;
                    if (i > 2 && i < this.gridSize + 2) {
                        this.enaclick = false;
                        m[downX][downY].translate(50 * (i - 2), 0);
                        m[downX - 1][downY].translate(50, 0);
                        m[i - 1][downY] = m[downX][downY];
                        m[downX][downY] = m[downX - 1][downY];
                        m[downX - 1][downY] = new Ball();
                        m[downX - 1][downY].set(colors[Math.floor((Math.random() * colors.length))], (downX - 1) * 50, downY * 50);
                        setTimeout(function() {
                            m[downX - 1][downY].draw();
                            p.enaclick = true;
                        }, 400);
                    }
                }
                //Jobb
                else if (downX == this.gridSize + 2 && m[this.gridSize + 1][downY].color == 'transparent') {
                    i = this.gridSize + 1;
                    while (m[i][downY].color == 'transparent') i--;
                    if (i >= 2 && i < this.gridSize + 1) {
                        this.enaclick = false;
                        m[downX][downY].translate(-50 * (this.gridSize - (i - 1)), 0);
                        m[downX + 1][downY].translate(-50, 0);
                        m[i + 1][downY] = m[downX][downY];
                        m[downX][downY] = m[downX + 1][downY];
                        m[downX + 1][downY] = new Ball();
                        m[downX + 1][downY].set(colors[Math.floor((Math.random() * colors.length))], (downX + 1) * 50, downY * 50);
                        setTimeout(function() {
                            m[downX + 1][downY].draw();
                            p.enaclick = true;
                        }, 400);
                    }
                }
            }
            setTimeout(function() {
                p.checkCombo();
            }, 400);
        }
    }

    function Ball() {
        this.div = document.createElement('div');
        this.color = 'transparent';
        this.r = 1;
        this.tx = 0;
        this.ty = 0;
    }
    Ball.prototype.translate = function(x, y) {
        this.tx += x;
        this.ty += y;
        this.div.style["-webkit-transform"] = "translate(" + this.tx + "px, " + this.ty + "px) scale(" + this.r + ")";
        this.div.style["-moz-transform"] = "translate(" + this.tx + "px, " + this.ty + "px) scale(" + this.r + ")";
        this.div.style["-ms-transform"] = "translate(" + this.tx + "px, " + this.ty + "px) scale(" + this.r + ")";
        this.div.style["-o-transform"] = "translate(" + this.tx + "px, " + this.ty + "px) scale(" + this.r + ")";
        this.div.style["transform"] = "translate(" + this.tx + "px, " + this.ty + "px) scale(" + this.r + ")";
    }
    Ball.prototype.draw = function() {
        $(this.div).css("left", this.cx + 'px').css("top", this.cy + 'px').addClass("ball " + this.color);
        $("#ball-container").append(this.div);
    }
    Ball.prototype.set = function(color, cx, cy) {
        this.color = color;
        this.cx = cx
        this.cy = cy;
    }
    Ball.prototype.shrink = function(r) {
        this.r = r;
        this.translate(0, 0, r);
        if (this.r == 0) {
            this.color = 'transparent';
            var d = $(this.div);
            setTimeout(function() {
                d.remove();
            }, 500);
        }
    }
}());
