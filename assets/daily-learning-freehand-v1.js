(function (root) {
  "use strict";
  // This is a freehand scratchpad, not a substitute for verified stroke-order data.
  // Coordinates are normalized so drawn strokes survive orientation/size changes.
  function mount(board, canvas) {
    if (!board || !canvas || typeof canvas.getContext !== "function") return null;
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;
    var strokes = [], current = null, pointerId = null, width = 0, height = 0;
    var active = true, destroyed = false;
    function repaint() {
      if (!width || !height || destroyed) return;
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#2563eb";
      ctx.fillStyle = "#2563eb";
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      strokes.forEach(function (stroke) {
        if (!stroke.length) return;
        if (stroke.length === 1) {
          ctx.beginPath();
          ctx.arc(stroke[0].x * width, stroke[0].y * height, 2.5, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        ctx.beginPath();
        stroke.forEach(function (point, i) {
          if (i) ctx.lineTo(point.x * width, point.y * height);
          else ctx.moveTo(point.x * width, point.y * height);
        });
        ctx.stroke();
      });
    }
    function resize() {
      if (destroyed) return;
      var r = canvas.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      var dpr = Math.min(3, root.devicePixelRatio || 1);
      if (width === r.width && height === r.height && canvas.width === Math.round(width * dpr)) return;
      width = r.width;
      height = r.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      repaint();
    }
    function point(event) {
      var r = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(1, (event.clientX - r.left) / Math.max(1, r.width))),
        y: Math.max(0, Math.min(1, (event.clientY - r.top) / Math.max(1, r.height)))
      };
    }
    function start(event) {
      if (destroyed || !active || pointerId !== null) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      resize();
      pointerId = event.pointerId;
      current = [point(event)];
      strokes.push(current);
      repaint();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(pointerId); } catch (error) {}
      }
    }
    function move(event) {
      if (destroyed || pointerId !== event.pointerId || !current) return;
      event.preventDefault();
      current.push(point(event));
      repaint();
    }
    function stop(event) {
      if (pointerId !== event.pointerId) return;
      event.preventDefault();
      pointerId = null;
      current = null;
      if (canvas.releasePointerCapture) {
        try { canvas.releasePointerCapture(event.pointerId); } catch (error) {}
      }
    }
    canvas.addEventListener("pointerdown", start, { passive: false });
    canvas.addEventListener("pointermove", move, { passive: false });
    canvas.addEventListener("pointerup", stop, { passive: false });
    canvas.addEventListener("pointercancel", stop, { passive: false });
    var touchStart, touchMove, touchEnd;
    if (!root.PointerEvent) {
      touchStart = function (e) {
        if (!active || current || !e.changedTouches.length) return;
        e.preventDefault();
        resize();
        current = [point(e.changedTouches[0])];
        strokes.push(current);
        repaint();
      };
      touchMove = function (e) {
        if (!current || !e.changedTouches.length) return;
        e.preventDefault();
        current.push(point(e.changedTouches[0]));
        repaint();
      };
      touchEnd = function (e) { if (current) { e.preventDefault(); current = null; } };
      canvas.addEventListener("touchstart", touchStart, { passive: false });
      canvas.addEventListener("touchmove", touchMove, { passive: false });
      canvas.addEventListener("touchend", touchEnd, { passive: false });
      canvas.addEventListener("touchcancel", touchEnd, { passive: false });
    }
    var observer = root.ResizeObserver ? new root.ResizeObserver(resize) : null;
    if (observer) observer.observe(canvas);
    if (root.requestAnimationFrame) root.requestAnimationFrame(resize);
    else resize();
    return {
      enable: function () { active = true; board.classList.add("ink-active"); resize(); },
      pause: function () { active = false; pointerId = null; current = null; board.classList.remove("ink-active"); },
      clear: function () { strokes = []; current = null; pointerId = null; repaint(); },
      count: function () { return strokes.length; },
      destroy: function () {
        destroyed = true;
        if (observer) observer.disconnect();
        canvas.removeEventListener("pointerdown", start);
        canvas.removeEventListener("pointermove", move);
        canvas.removeEventListener("pointerup", stop);
        canvas.removeEventListener("pointercancel", stop);
        if (touchStart) {
          canvas.removeEventListener("touchstart", touchStart);
          canvas.removeEventListener("touchmove", touchMove);
          canvas.removeEventListener("touchend", touchEnd);
          canvas.removeEventListener("touchcancel", touchEnd);
        }
      }
    };
  }
  root.VDuckieDailyFreehand = Object.freeze({ mount: mount });
})(window);
