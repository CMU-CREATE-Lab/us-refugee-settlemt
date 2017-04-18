function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);

    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }

    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    var program = gl.createProgram();

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    var wrapper = {program: program};

    var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < numAttributes; i++) {
        var attribute = gl.getActiveAttrib(program, i);
        wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
    }
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i$1 = 0; i$1 < numUniforms; i$1++) {
        var uniform = gl.getActiveUniform(program, i$1);
        wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }

    return wrapper;
}

function createTexture(gl, filter, data, width, height) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    if (data instanceof Uint8Array) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

function bindTexture(gl, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

function createBuffer(gl, data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

function bindAttribute(gl, program, attribute, size, type, normalized, stride, pointer) {
    var attributeLoc = gl.getAttribLocation(program, attribute);
    gl.enableVertexAttribArray(attributeLoc);
    gl.vertexAttribPointer(attributeLoc, size, type, normalized, stride, pointer);
}

function bindFramebuffer(gl, framebuffer, texture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    if (texture) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    }
}

var pointVertexShader = "" +
"attribute vec4 a_coord;\n" +
"attribute float a_total;\n" +
"uniform mat4 u_map_matrix;\n" +
"uniform float u_point_size;\n" +
"void main() {\n" +
"  gl_Position = u_map_matrix * a_coord;\n" +
"  gl_PointSize = u_point_size * a_total;\n" +
"}";

var pointFragmentShader = "" +
"#extension GL_OES_standard_derivatives : enable\n" +
"precision mediump float;\n" +
"void main() {\n" +
"  // set pixels in points to something that stands out\n" +
"  //float dist = distance(gl_PointCoord.xy, vec2(0.5, 0.5));\n" +
"  //float delta = fwidth(dist);\n" +
"  //float alpha = smoothstep(0.45-delta, 0.45, dist);\n" +
"  //gl_FragColor = vec4(.65, .07, .07, .75) * (1. - alpha);\n" +
'          float dist = length(gl_PointCoord.xy - vec2(.5, .5));\n' +
'          dist = 1. - (dist * 2.);\n' +
'          dist = max(0., dist);\n' +
'          float delta = fwidth(dist);\n' +
'          float alpha = smoothstep(0.45-delta, 0.45, dist);\n' +
'          vec4 circleColor = vec4(.65, .07, .07, .95);\n' +
'          vec4 outlineColor = vec4(1.0,1.0,1.0,1.0);\n' +
'          float outerEdgeCenter = 0.5 - .01;\n' +
'          float stroke = smoothstep(outerEdgeCenter - delta, outerEdgeCenter + delta, dist);\n' +
'          gl_FragColor = vec4( mix(outlineColor.rgb, circleColor.rgb, stroke), alpha*.75 );\n' +

"}";



var Refugees = function Refugees(gl) {
    this.gl = gl;
    this.programs = {
        'totals': createProgram(gl, pointVertexShader, pointFragmentShader)
    }
    this.numAttributes = {
        'totals': 3,
        'airReleases': 3,
        'waterReleases': 3,
        'landReleases': 3

    }
    this.buffers = {
        'totals': {
            'count': 0,
            'buffer': null            
        },
        'airReleases': {
            'count': 0,
            'buffer': null            
        },        
        'waterReleases': {
            'count': 0,
            'buffer': null            
        },        
        'landReleases': {
            'count': 0,
            'buffer': null            
        }        

    }
    this.showTotals = true;
    this.showAirReleases = false;
    this.showWaterReleases = false;
    this.showLandReleases = false;

}

Refugees.prototype.setBuffer = function (key, data) {
    this.buffers[key].count = data.length / this.numAttributes[key];
    this.buffers[key].buffer = createBuffer(gl, data);   
}

Refugees.prototype.drawTotals = function (transform, options) {
    var options = options || {};
    var pointSize = options.pointSize || 10.;
    var gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
    var program = this.programs['totals'];
    var buffer = this.buffers['totals'];
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
    bindAttribute(gl, program.program, 'a_coord', 2, gl.FLOAT, false, 12, 0);    
    bindAttribute(gl, program.program, 'a_total', 1, gl.FLOAT, false, 12, 8);    
    gl.uniformMatrix4fv(program.u_map_matrix, false, transform);
    gl.uniform1f(program.u_point_size, pointSize);

    if (this.showTotals) {
        gl.drawArrays(gl.POINTS, 0, buffer.count);
    }
    gl.disable(gl.BLEND);

};

Refugees.prototype.drawReleases = function (transform, options) {
    var options = options || {};
    var release = options.release;
    var color = options.color;
    var pointSize = options.pointSize || 10.;
    var gl = this.gl;
    //gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
    var program = this.programs[release];
    var buffer = this.buffers[release];
    gl.useProgram(program.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer);
    bindAttribute(gl, program.program, 'a_coord', 2, gl.FLOAT, false, 12, 0);    
    bindAttribute(gl, program.program, 'a_release', 1, gl.FLOAT, false, 12, 8);    
    gl.uniformMatrix4fv(program.u_map_matrix, false, transform);
    gl.uniform1f(program.u_point_size, pointSize);
    gl.uniform4fv(program.u_color, color);

    //if (this.showAirReleases) {
        gl.drawArrays(gl.POINTS, 0, buffer.count);
    //}
    gl.disable(gl.BLEND);
};

