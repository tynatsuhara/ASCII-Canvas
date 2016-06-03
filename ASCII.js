var keysDown = [];

// Constructor for ASCII Canvas object
function AsciiCanvas(width, height, fun) {
  document.querySelector("body").onkeydown = function(event) {
    if (!keysDown.includes(event.keyCode))
      keysDown.push(event.keyCode);
  };

  document.querySelector("body").onkeyup = function(event) {
    var pos = keysDown.indexOf(event.keyCode);
    if (pos > -1)
      keysDown.splice(pos, 1);
  };

  this.width = width;
  this.height = height;
  this.elements = [];
  this.gameLoopFn = fun;

  this.cameraX = 0;
  this.cameraY = 0;
  this.translateCamera = function(dx, dy) {
    this.cameraX += dx;
    this.cameraY += dy;
  };
  this.setCameraPos = function(x, y) {
    this.cameraX = x;
    this.cameraY = y;
  };

  this.add = function(str, x, y) {
    x |= 0;
    y |= 0;
    var el = new Element(str, x, y);
    this.elements.push(el);
    return el;
  };

  this.remove = function(el) {
    this.elements.remove(el);
  };

  this.update = function() {
    for (var i = 0; i < this.elements.length; i++) {
      if (!this.elements[i].stopped)
        this.elements[i].nextFrame();
    }
  };

  this.start = function(interval) {
    this.gameLoopFn();
    interval |= 0;
    if (!this.gameLoopTimer) {
      var canv = this;
      if (interval > 0) {
        canv.gameLoopTimer = setInterval(function() {
          canv.update();
          canv.gameLoopFn();
        }, interval);
      }
    }
  };

  this.stop = function() {
    if (this.gameLoopTimer) {
      clearInterval(this.gameLoopTimer);
      this.gameLoopTimer = null;
    }
  };

  this.toString = function() {
    var arr = new Array(this.width);
    for (var i = 0; i < arr.length; i++) {
      arr[i] = new Array(this.height);
    }
    for (var i = 0; i < this.elements.length; i++) {
      var el = this.elements[i];
      // get the frame from el, put it in the array
      for (var x = 0; x < el.width; x++) {
        if (el.x + x < this.cameraX || el.x + x >= this.width + this.cameraX)
          continue;
        for (var y = 0; y < el.height; y++) {
          if (el.y + y < this.cameraY || el.y + y >= this.height + this.cameraY)
            continue;
          var ch = el.charAtPos(x, y);
          if (ch != ' ')
            arr[x + el.x - this.cameraX][y + el.y - this.cameraY] = ch;
        }
      }
    }
    var str = "";
    for (var i = 0; i < this.height; i++) {
      for (var j = 0; j < this.width; j++) {
        str += arr[j][i] == undefined ? " " : arr[j][i];
      }
      if (i != this.height - 1)
        str += "</br>";
    }
    return str;
  };

  this.keyDown = function(key) {
    return keysDown.includes(key);
  }
}

function Element(el, x, y) {
  this.str = el.s;
  this.x = x;
  this.y = y;
  this.width = el.w;
  this.height = el.h;
  this.frameCount = el.s.length / (el.w * el.h);
  this.currentFrame = 0;
  this.stopped = false;

  // gets the character at the local position for this object
  // e.g. el.charAtPos(0, 0) returns the top left corner
  this.charAtPos = function(x, y) {
    return this.str.charAt(this.currentFrame * this.width * this.height + y * this.width + x);
  };

  // gets the character at the global coordinates, returns
  // null if the element doesn't occupy that space
  this.charAtGlobalPos = function(x, y) {
    if (x < this.x || x >= this.x + this.width ||
        y < this.y || y >= this.y + this.height)
      return null;
    return this.charAtPos(x - this.x, y - this.y);
  }

  // Go to the next frame
  this.nextFrame = function() {
    this.currentFrame = (this.currentFrame + 1) % this.frameCount;
  };

  // Go to the prev frame
  this.prevFrame = function() {
    this.currentFrame--;
    if (this.currentFrame < 0)
      this.currentFrame = this.frameCount - 1;
  };

  // Goes to the given frame, if it's in the range.
  // If it's outside the range, nothing happens
  this.gotoFrame = function(frame) {
    if (frame >= 0 && frame < this.frameCount)
      this.frameCount = frame;
  };

  this.moveTo = function(x, y) {
    this.x = x;
    this.y = y;
  };
  this.translate = function(dx, dy) { this.moveTo(this.x + dx, this.y + dy); };

  this.hitTest = function(other) {
    if (!other) return;
    return !(this.x + this.width <= other.x || this.x >= other.x + other.width ||
             this.y + this.height <= other.y || this.y >= other.y + other.height);
  }

  this.hitTestExact = function(other) {
    if (!this.hitTest(other)) return;
    for (var x = this.x; x < this.x + this.width; x++) {
      for (var y = this.y; y < this.y + this.height; y++) {
        var thisPt = this.charAtGlobalPos(x, y);
        var otherPt = other.charAtGlobalPos(x, y);
        if (thisPt != null && thisPt != ' ' && otherPt != null && otherPt != ' ')
          return true;
      }
    }
    return false;
  }

  // The element will no longer advance
  this.stop = function() { this.stopped = true; };
  this.play = function() { this.stopped = false; };
}