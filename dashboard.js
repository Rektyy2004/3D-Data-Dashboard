import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { CSS3DRenderer, CSS3DObject } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/renderers/CSS3DRenderer.js';
import { TrackballControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/TrackballControls.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.6.4/dist/tween.esm.js';

let camera, scene, renderer, controls;
const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [] };

document.addEventListener('DOMContentLoaded', () => {
    init();
    createIndicatorBar();
    syncUserProfile();
});

async function init() {
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;
    scene = new THREE.Scene();

    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('visualization').appendChild(renderer.domElement);

    controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 0.5;
    controls.addEventListener('change', render);

    await fetchSheetData();
    setupMenuListeners();
    window.addEventListener('resize', onWindowResize);
    animate();
}

function syncUserProfile() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userAvatar').src = userData.picture;
    }
}

function createIndicatorBar() {
    const bar = document.getElementById('netWorthBar');
    if (bar) bar.innerHTML = ''; 
}

async function fetchSheetData() {
    try {
        // Fetch from your local JSON file instead of Google Sheets
        const response = await fetch('./data.json');
        const rows = await response.json();
        
        if (!rows) return;

        rows.forEach((row, i) => {
            // Convert "$250,000" string to a number for color logic
            const netWorthValue = parseFloat(row[5].replace(/[$,]/g, '')) || 0;
            
            createCSSObject(row, i, netWorthValue);
            calculateTargets(i);
        });

        document.getElementById('loading').style.display = 'none';
        transform(targets.table, 2000);
    } catch (err) { 
        console.error("Error loading local data:", err); 
    }
}

function createCSSObject(data, i, netWorth) {
    const element = document.createElement('div');
    element.className = 'element';
    
    // Determine the base color
    let color = '#3A9F48'; 
    let rgbaBg = 'rgba(58, 159, 72, 0.15)'; 
    
    if (netWorth < 100000) {
        color = '#EF3022'; 
        rgbaBg = 'rgba(239, 48, 34, 0.15)';
    } else if (netWorth <= 200000) {
        color = '#FDCA35'; 
        rgbaBg = 'rgba(253, 202, 53, 0.15)';
    }

    element.style.border = `1px solid ${color}`;
    element.style.backgroundColor = rgbaBg;
    element.style.boxShadow = `inset 0 0 15px ${rgbaBg}`;

    element.innerHTML = `
        <div class="tile-header">
            <span class="country-label">${data[3]}</span>
            <span class="age-label">AGE ${data[2]}</span>
        </div>
        <div class="photo-wrap">
            <img src="${data[1]}" class="tile-img" style="border-color: ${color}">
        </div>
        <div class="name-label">${data[0]}</div>
        <div class="interest-label">${data[4]}</div>
    `;

    element.onclick = () => showProfileDetail(data, color);

    const objectCSS = new CSS3DObject(element);
    objectCSS.position.set(Math.random() * 4000 - 2000, Math.random() * 4000 - 2000, Math.random() * 4000 - 2000);
    scene.add(objectCSS);
    objects.push(objectCSS);
}

function showProfileDetail(data, color) {
    const panel = document.getElementById('infoPanel');
    panel.innerHTML = `
        <div class="detail-card">
            <div style="text-align:center">
                <img src="${data[1]}" style="width:120px; border-radius:50%; border:4px solid ${color}; margin-bottom: 15px;">
                <h2 style="color:var(--primary-cyan); margin-bottom: 20px;">${data[0]}</h2>
                
                <div style="text-align: left; line-height: 1.8;">
                    <p><span style="color: #64748b;">Age:</span> ${data[2]}</p>
                    <p><span style="color: #64748b;">Country:</span> ${data[3]}</p>
                    <p><span style="color: #64748b;">Interest:</span> ${data[4]}</p>
                </div>

                <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 10px; color: #64748b; margin-bottom: 5px;">NET WORTH</div>
                    <h3 style="color:${color}; font-size: 28px; font-weight: 800;">${data[5]}</h3>
                </div>
            </div>
        </div>
    `;
}

function calculateTargets(i) {
    // 1. Table: 20x20
    const objTable = new THREE.Object3D();
    objTable.position.x = ((i % 20) * 180) - 1700;
    objTable.position.y = -(Math.floor(i / 20) * 220) + 1000;
    targets.table.push(objTable);

    // 2. Sphere
    const objSphere = new THREE.Object3D();
    const phi = Math.acos(-1 + (2 * i) / 200);
    const theta = Math.sqrt(200 * Math.PI) * phi;
    objSphere.position.setFromSphericalCoords(900, phi, theta);
    const vectorSphere = new THREE.Vector3().copy(objSphere.position).multiplyScalar(2);
    objSphere.lookAt(vectorSphere);
    targets.sphere.push(objSphere);

    // 3. Double Helix
    const objHelix = new THREE.Object3D();
    const helixTheta = i * 0.175 + Math.PI;
    const y = -(i * 8) + 450;
    const strandOffset = (i % 2) * Math.PI;
    objHelix.position.setFromCylindricalCoords(900, helixTheta + strandOffset, y);
    const vectorHelix = new THREE.Vector3(objHelix.position.x * 2, objHelix.position.y, objHelix.position.z * 2);
    objHelix.lookAt(vectorHelix);
    targets.helix.push(objHelix);

    // 4. Grid: 5x4x10
    const objGrid = new THREE.Object3D();
    objGrid.position.x = ((i % 5) * 400) - 800;
    objGrid.position.y = (-(Math.floor(i / 5) % 4) * 400) + 600;
    objGrid.position.z = (Math.floor(i / 20)) * -800 + 1000;
    targets.grid.push(objGrid);
}

function setupMenuListeners() {
    const buttons = document.querySelectorAll('.view-btn');
    buttons.forEach(btn => {
        btn.onclick = () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            transform(targets[btn.id], 2000);
        };
    });
}

function transform(targetArray, duration) {
    TWEEN.removeAll();
    objects.forEach((obj, i) => {
        const target = targetArray[i];
        new TWEEN.Tween(obj.position).to({ x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration).easing(TWEEN.Easing.Exponential.InOut).start();
        new TWEEN.Tween(obj.rotation).to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration).easing(TWEEN.Easing.Exponential.InOut).start();
    });
    new TWEEN.Tween(this).to({}, duration * 2).onUpdate(render).start();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function animate() { requestAnimationFrame(animate); TWEEN.update(); controls.update(); }
function render() { renderer.render(scene, camera); }

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        });
    }
});