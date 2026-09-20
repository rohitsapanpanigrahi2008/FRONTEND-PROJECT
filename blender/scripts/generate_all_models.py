# Blender CLI: build + export all dashboard 3D models as optimized GLB.
#
# Usage:
#   blender --background --python blender/scripts/generate_all_models.py -- --out public/models
#
# Notes:
# - Runs headless (no GUI). Works on Blender 3.6 LTS … 5.x by falling back
#   gracefully when API names differ between versions.
# - Every model ships with a short LOOPING animation so the dashboard gets
#   motion for free from useGLTF + AnimationMixer, or as static decor.
# - Meshes are low-poly by design; Draco compression is applied when the
#   addon is available to keep each file well under its size budget.

import bpy
import sys
import os
import math
import argparse

# ---------------------------------------------------------------- utilities --

def reset_scene():
    """Wipe the scene to a clean, empty state."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 240
    scene.render.fps = 24
    # New keyframes default to LINEAR so loops are seamless in GLB. This works
    # across Blender 3.6 → 5.x (unlike iterating action.fcurves, removed in 5.0).
    try:
        bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
    except (AttributeError, TypeError):
        pass


def new_material(name, base_color, metallic=0.1, roughness=0.55,
                 emission_color=None, emission_strength=0.0):
    """Principled BSDF material compatible across Blender 3.6 → 5.x."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return mat

    def set_input(names, value):
        for n in names:
            sock = bsdf.inputs.get(n)
            if sock is not None:
                sock.default_value = value
                return True
        return False

    set_input(["Base Color"], base_color)
    set_input(["Metallic"], metallic)
    set_input(["Roughness"], roughness)
    if emission_color is not None and emission_strength > 0:
        set_input(["Emission Color", "Emission"], emission_color)
        set_input(["Emission Strength"], emission_strength)
    return mat


def smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return obj


def make_linear(_obj):
    """Kept for call-site compatibility: linear interpolation is now the
    default keyframe type, configured once in reset_scene()."""
    return


def spin(obj, axis='Z', revolutions=1.0, frames=(1, 240)):
    """Continuous rotation loop."""
    start, end = frames
    idx = {'X': 0, 'Y': 1, 'Z': 2}[axis]
    obj.keyframe_insert(data_path="rotation_euler", frame=start, index=idx)
    total = math.pi * 2 * revolutions
    setattr(obj.rotation_euler, axis.lower(), total)
    obj.keyframe_insert(data_path="rotation_euler", frame=end, index=idx)
    make_linear(obj)


def pulse(obj, data_path='scale', base=1.0, amplitude=0.35, period=120,
          frames=(1, 240)):
    """Scale pulse that starts and ends at the same value (perfect loop)."""
    start, end = frames
    mid = start + period / 2
    def setv(f, v):
        obj.scale = (v, v, v) if data_path == 'scale' else obj.scale
        obj.keyframe_insert(data_path=data_path, frame=f)
    setv(start, base)
    setv(mid, base + amplitude)
    setv(end, base)
    make_linear(obj)


def slide(obj, attr, path, start_value, end_value, frames=(1, 240)):
    """Move a property from A→B→A over the range (ping-pong loop)."""
    start, end = frames
    mid = start + (end - start) / 2
    setattr(obj, attr, start_value)
    obj.keyframe_insert(data_path=path, frame=start)
    setattr(obj, attr, end_value)
    obj.keyframe_insert(data_path=path, frame=mid)
    setattr(obj, attr, start_value)
    obj.keyframe_insert(data_path=path, frame=end)
    make_linear(obj)


# ------------------------------------------------------------ model builders --

CABLE = None  # shared material cache per scene


def build_facility_globe():
    """Facility globe: rotating earth with pulsing status markers."""
    earth_mat = new_material("Earth", (0.016, 0.145, 0.239, 1), metallic=0.25, roughness=0.45)
    grid_mat = new_material("Grid", (0.22, 0.71, 0.98, 1), emission_color=(0.22, 0.71, 0.98, 1),
                            emission_strength=0.6)
    ok_mat = new_material("MarkerOK", (0.13, 0.83, 0.65, 1),
                          emission_color=(0.13, 0.83, 0.65, 1), emission_strength=3.0)
    bad_mat = new_material("MarkerBad", (0.98, 0.44, 0.52, 1),
                           emission_color=(0.98, 0.44, 0.52, 1), emission_strength=3.0)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.25, segments=48, ring_count=32)
    earth = smooth(bpy.context.active_object)
    earth.materials if False else earth.data.materials.append(earth_mat)
    earth.name = "Globe"

    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.29, segments=32, ring_count=16)
    shell = bpy.context.active_object
    shell.name = "GlobeWire"
    wire = shell.modifiers.new("wire", 'WIREFRAME')
    wire.thickness = 0.006
    shell.data.materials.append(grid_mat)
    spin(shell, 'Z', revolutions=1.0)
    # NOTE: the earth sphere itself carries NO baked animation — the frontend
    # drives its rotation from the live health score via the 'rotation' binding.

    # Fibonacci-distributed markers
    n = 8
    for i in range(n):
        phi = math.acos(1 - (2 * (i + 0.5)) / n)
        theta = math.pi * (1 + math.sqrt(5)) * i
        x = 1.32 * math.sin(phi) * math.cos(theta)
        y = 1.32 * math.sin(phi) * math.sin(theta)
        z = 1.32 * math.cos(phi)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, segments=12, ring_count=8,
                                             location=(x, y, z))
        marker = smooth(bpy.context.active_object)
        marker.name = f"Marker_{i}"
        marker.data.materials.append(bad_mat if i == 2 else ok_mat)
        marker.parent = shell
        pulse(marker, base=1.0, amplitude=0.5, period=120, frames=(1 + i * 8, 241 + i * 8))

    return {"data-node": earth}


def build_air_quality_viz():
    """Baked particle field: pollutant motes drifting upward through a sensor ring."""
    low_mat = new_material("PollLow", (0.13, 0.83, 0.65, 1),
                           emission_color=(0.13, 0.83, 0.65, 1), emission_strength=1.4)
    mid_mat = new_material("PollMid", (0.98, 0.75, 0.14, 1),
                           emission_color=(0.98, 0.75, 0.14, 1), emission_strength=1.4)
    high_mat = new_material("PollHigh", (0.98, 0.44, 0.52, 1),
                            emission_color=(0.98, 0.44, 0.52, 1), emission_strength=1.4)
    sensor_mat = new_material("Sensor", (0.22, 0.71, 0.98, 1), metallic=0.6, roughness=0.3,
                              emission_color=(0.22, 0.71, 0.98, 1), emission_strength=0.8)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.9, minor_radius=0.05,
                                     location=(0, -0.6, 0.4), rotation=(math.pi / 2.2, 0, 0))
    ring = bpy.context.active_object
    ring.name = "SensorRing"
    ring.data.materials.append(sensor_mat)

    count = 140
    for i in range(count):
        x = (hash(("x", i)) % 1000 / 1000 - 0.5) * 2.6
        z = (hash(("z", i)) % 1000 / 1000 - 0.5) * 2.6
        y0 = -1.4 + (hash(("y", i)) % 1000 / 1000) * 2.4
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.022 + (i % 4) * 0.006,
                                              subdivisions=1, location=(x, y0, z))
        mote = bpy.context.active_object
        mote.name = f"Mote_{i}"
        level = hash(("lvl", i)) % 10
        mote.data.materials.append(high_mat if level > 7 else mid_mat if level > 4 else low_mat)
        # Drift upward and loop back down (ping-pong) — reads as continuous flow in GLB.
        rise = 1.0 + (i % 7) * 0.22
        slide(mote, "location", "location",
              (x, y0, z), (x, y0 + rise, z),
              frames=(1 + (i % 30) * 4, 121 + (i % 30) * 4))
    return {"data-node": ring, "particles": ring}


def build_energy_flow():
    """Central energy core with spinning rings and outward power cables."""
    core_mat = new_material("Core", (0.98, 0.75, 0.14, 1), metallic=0.4, roughness=0.3,
                            emission_color=(0.98, 0.75, 0.14, 1), emission_strength=2.2)
    ring_mat = new_material("Ring", (0.98, 0.75, 0.14, 1),
                            emission_color=(0.98, 0.75, 0.14, 1), emission_strength=1.2)
    cable_mat = new_material("Cable", (0.06, 0.09, 0.16, 1), metallic=0.7, roughness=0.35)
    node_mat = new_material("Node", (0.13, 0.83, 0.65, 1),
                            emission_color=(0.13, 0.83, 0.65, 1), emission_strength=2.0)

    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.85, subdivisions=2)
    core = smooth(bpy.context.active_object)
    core.name = "Core"
    core.data.materials.append(core_mat)
    pulse(core, base=1.0, amplitude=0.06, period=48)

    ring_specs = [(1.35, (math.pi / 2.4, 0, 0)), (1.55, (math.pi / 1.7, 0.5, 0))]
    for idx, (r, rot) in enumerate(ring_specs):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.03,
                                         location=(0, 0, 0), rotation=rot)
        ring = bpy.context.active_object
        ring.name = f"Ring_{idx}"
        ring.data.materials.append(ring_mat)
        spin(ring, 'Z', revolutions=1.0)

    # Cables radiating outward with pulse nodes travelling along them
    for i in range(6):
        angle = i / 6 * math.pi * 2
        dx, dy = math.cos(angle), math.sin(angle)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=1.9,
                                            location=(dx * 1.75, dy * 1.75, 0),
                                            rotation=(0, math.pi / 2, angle + math.pi / 2))
        cable = bpy.context.active_object
        cable.name = f"Cable_{i}"
        cable.data.materials.append(cable_mat)

        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, segments=12, ring_count=8,
                                             location=(dx * 1.0, dy * 1.0, 0))
        node = smooth(bpy.context.active_object)
        node.name = f"EnergyPulse_{i}"
        node.data.materials.append(node_mat)
        slide(node, "location", "location",
              (dx * 1.0, dy * 1.0, 0), (dx * 2.6, dy * 2.6, 0),
              frames=(1 + i * 10, 121 + i * 10))
    return {"data-node": core}


def build_waste_station():
    """Row of smart bins with animated fill levels and an opening lid."""
    body_mat = new_material("BinBody", (0.2, 0.25, 0.33, 1), roughness=0.7)
    fills = [
        new_material("Fill0", (0.13, 0.83, 0.65, 1), emission_color=(0.13, 0.83, 0.65, 1), emission_strength=0.8),
        new_material("Fill1", (0.98, 0.75, 0.14, 1), emission_color=(0.98, 0.75, 0.14, 1), emission_strength=0.8),
        new_material("Fill2", (0.98, 0.57, 0.24, 1), emission_color=(0.98, 0.57, 0.24, 1), emission_strength=0.9),
        new_material("Fill3", (0.98, 0.44, 0.52, 1), emission_color=(0.98, 0.44, 0.52, 1), emission_strength=1.2),
    ]
    fill_levels = [0.25, 0.5, 0.72, 0.95]

    for i, level in enumerate(fill_levels):
        x = (i - 1.5) * 0.85
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 0.55))
        body = bpy.context.active_object
        body.name = f"Bin_{i}"
        body.scale = (0.55, 0.55, 1.1)
        body.data.materials.append(body_mat)

        h = max(0.06, level * 1.0)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 0.08 + h / 2 * 0.9))
        fill = bpy.context.active_object
        fill.name = f"Fill_{i}"
        fill.scale = (0.44, 0.44, h * 0.9)
        fill.data.materials.append(fills[i])
        # Fill_3 is the data-bound node (frontend drives its height live), so it
        # gets no baked animation; the others drift subtly on a loop.
        if i != 3:
            slide(fill, "scale", "scale",
                  (0.44, 0.44, h * 0.8), (0.44, 0.44, min(1.0, h * 1.15)),
                  frames=(1, 240))

        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 1.18))
        lid = bpy.context.active_object
        lid.name = f"Lid_{i}"
        lid.scale = (0.6, 0.6, 0.08)
        lid.data.materials.append(body_mat)
        if i == 3:  # fullest bin: lid opens and closes
            lid.keyframe_insert(data_path="rotation_euler", frame=1, index=1)
            lid.rotation_euler[1] = math.radians(-55)
            lid.keyframe_insert(data_path="rotation_euler", frame=60, index=1)
            lid.rotation_euler[1] = 0
            lid.keyframe_insert(data_path="rotation_euler", frame=180, index=1)
            lid.rotation_euler[1] = 0
            lid.keyframe_insert(data_path="rotation_euler", frame=240, index=1)
            make_linear(lid)

    bpy.ops.mesh.primitive_plane_add(size=5, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Pad"
    pad_mat = new_material("Pad", (0.05, 0.08, 0.15, 1), roughness=0.9)
    ground.data.materials.append(pad_mat)
    return {"data-node": bpy.data.objects["Fill_3"], "particles": bpy.data.objects["Fill_3"]}


def build_water_tank():
    """Water tank with oscillating fill level, pipes and a drip."""
    tank_mat = new_material("Tank", (0.75, 0.78, 0.82, 1), metallic=0.6, roughness=0.35)
    water_mat = new_material("Water", (0.11, 0.62, 0.78, 1), roughness=0.15,
                             emission_color=(0.11, 0.62, 0.78, 1), emission_strength=0.35)
    pipe_mat = new_material("Pipe", (0.35, 0.4, 0.48, 1), metallic=0.8, roughness=0.4)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.75, depth=2.0, location=(0, 0, 1.0), vertices=40)
    tank = smooth(bpy.context.active_object)
    tank.name = "Tank"
    tank.data.materials.append(tank_mat)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.66, depth=1.8, location=(0, 0, 0.78), vertices=40)
    water = smooth(bpy.context.active_object)
    water.name = "WaterLevel"
    water.scale = (1.0, 1.0, 0.75)
    water.data.materials.append(water_mat)
    # WaterLevel is data-bound (frontend drives its height); no baked animation.

    for dx in (-0.95, 0.95):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=1.4,
                                            location=(dx, 0, 1.6),
                                            rotation=(0, math.pi / 2, 0))
        pipe = bpy.context.active_object
        pipe.name = f"Pipe_{'L' if dx < 0 else 'R'}"
        pipe.data.materials.append(pipe_mat)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, segments=10, ring_count=8,
                                         location=(0.95, 0, 0.2))
    drip = bpy.context.active_object
    drip.name = "Drip"
    drip.data.materials.append(water_mat)
    slide(drip, "location", "location", (0.95, 0, 1.0), (0.95, 0, -0.05), frames=(1, 60))
    return {"data-node": water, "particles": drip}


def build_traffic_flow():
    """Bird's-eye road loop with vehicles and a pulsing congestion hotspot."""
    road_mat = new_material("Road", (0.09, 0.1, 0.13, 1), roughness=0.9)
    lane_mat = new_material("Lane", (0.85, 0.85, 0.8, 1),
                            emission_color=(0.85, 0.85, 0.8, 1), emission_strength=0.25)
    hotspot_mat = new_material("Hotspot", (0.98, 0.44, 0.52, 1),
                               emission_color=(0.98, 0.44, 0.52, 1), emission_strength=2.0)
    car_mats = [
        new_material("CarBlue", (0.22, 0.71, 0.98, 1), emission_color=(0.22, 0.71, 0.98, 1), emission_strength=0.7),
        new_material("CarGreen", (0.13, 0.83, 0.65, 1), emission_color=(0.13, 0.83, 0.65, 1), emission_strength=0.7),
        new_material("CarAmber", (0.98, 0.75, 0.14, 1), emission_color=(0.98, 0.75, 0.14, 1), emission_strength=0.7),
    ]

    bpy.ops.mesh.primitive_plane_add(size=4.4, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Ground"
    ground.data.materials.append(road_mat)

    for idx, y in enumerate((-0.45, 0.45)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y, 0.01))
        lane = bpy.context.active_object
        lane.name = f"Lane_{idx}"
        lane.scale = (2.2, 0.03, 0.01)
        lane.data.materials.append(lane_mat)

    for i in range(6):
        y = -0.45 if i % 2 == 0 else 0.45
        direction = 1 if i % 2 == 0 else -1
        bpy.ops.mesh.primitive_cube_add(size=1, location=(direction * -2.0 + i * 0.3, y, 0.12))
        car = bpy.context.active_object
        car.name = f"Vehicle_{i}"
        car.scale = (0.16, 0.09, 0.07)
        car.data.materials.append(car_mats[i % 3])
        start_x = -2.2 if direction > 0 else 2.2
        end_x = 2.2 if direction > 0 else -2.2
        car.location = (start_x, y, 0.12)
        car.keyframe_insert(data_path="location", frame=1)
        car.location = (end_x, y, 0.12)
        car.keyframe_insert(data_path="location", frame=240)
        make_linear(car)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, segments=16, ring_count=12,
                                         location=(0.8, 0, 0.05))
    hotspot = bpy.context.active_object
    hotspot.name = "Hotspot"
    hotspot.data.materials.append(hotspot_mat)
    # Hotspot is data-bound (frontend scales it with congestion); no baked pulse.
    return {"data-node": hotspot}


def build_asset_tracker():
    """Equipment row with status beacons (operational / idle / fault)."""
    body_mat = new_material("MachineBody", (0.17, 0.2, 0.27, 1), metallic=0.55, roughness=0.45)
    status_mats = [
        new_material("StOperational", (0.13, 0.83, 0.65, 1), emission_color=(0.13, 0.83, 0.65, 1), emission_strength=2.5),
        new_material("StIdle", (0.98, 0.75, 0.14, 1), emission_color=(0.98, 0.75, 0.14, 1), emission_strength=2.0),
        new_material("StMaintenance", (0.98, 0.57, 0.24, 1), emission_color=(0.98, 0.57, 0.24, 1), emission_strength=2.0),
        new_material("StFault", (0.98, 0.44, 0.52, 1), emission_color=(0.98, 0.44, 0.52, 1), emission_strength=2.5),
    ]
    statuses = [0, 1, 3, 2]

    for i, st in enumerate(statuses):
        x = (i - 1.5) * 1.05
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 0.4))
        machine = bpy.context.active_object
        machine.name = f"Asset_{i}"
        machine.scale = (0.7, 0.5, 0.8)
        machine.data.materials.append(body_mat)

        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=14, ring_count=10,
                                             location=(x, 0, 1.05))
        beacon = smooth(bpy.context.active_object)
        beacon.name = f"Status_{i}"
        beacon.data.materials.append(status_mats[st])
        if st == 0:  # only the operational beacon pulses; Status_3 is data-bound
            pulse(beacon, base=1.0, amplitude=0.45, period=60)

        bpy.ops.mesh.primitive_cylinder_add(radius=0.045, depth=0.4,
                                            location=(x, 0, 0.85))
        post = bpy.context.active_object
        post.name = f"Post_{i}"
        post.data.materials.append(body_mat)

    bpy.ops.mesh.primitive_plane_add(size=5.2, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Pad"
    ground.data.materials.append(new_material("AssetPad", (0.05, 0.08, 0.15, 1), roughness=0.9))
    return {"data-node": bpy.data.objects["Status_3"]}


def build_safety_beacon():
    """Perimeter beacon post with pulsing emergency light."""
    pole_mat = new_material("Pole", (0.55, 0.58, 0.62, 1), metallic=0.8, roughness=0.35)
    light_mat = new_material("BeaconLight", (0.98, 0.25, 0.35, 1),
                             emission_color=(0.98, 0.25, 0.35, 1), emission_strength=4.0)
    base_mat = new_material("BeaconBase", (0.05, 0.08, 0.15, 1), roughness=0.9)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=1.9, location=(0, 0, 0.95), vertices=24)
    pole = smooth(bpy.context.active_object)
    pole.name = "Pole"
    pole.data.materials.append(pole_mat)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, segments=20, ring_count=14,
                                         location=(0, 0, 2.0))
    beacon = smooth(bpy.context.active_object)
    beacon.name = "Beacon"
    beacon.data.materials.append(light_mat)
    pulse(beacon, base=1.0, amplitude=0.55, period=60)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.9, minor_radius=0.02,
                                     location=(0, 0, 1.2))
    halo = bpy.context.active_object
    halo.name = "Halo"
    halo.rotation_euler = (math.pi / 2, 0, 0)
    halo.data.materials.append(light_mat)
    spin(halo, 'Z', revolutions=1.0)

    bpy.ops.mesh.primitive_cylinder_add(radius=1.05, depth=0.06, location=(0, 0, 0.03), vertices=40)
    base = bpy.context.active_object
    base.name = "Pad"
    base.data.materials.append(base_mat)
    return {"data-node": beacon}


def build_sustainability_meter():
    """Gauge dial with animated needle sweeping the good→bad arc."""
    dial_mat = new_material("DialFace", (0.08, 0.12, 0.2, 1), metallic=0.4, roughness=0.4)
    arc_good = new_material("ArcGood", (0.13, 0.83, 0.65, 1),
                            emission_color=(0.13, 0.83, 0.65, 1), emission_strength=2.0)
    arc_warn = new_material("ArcWarn", (0.98, 0.75, 0.14, 1),
                            emission_color=(0.98, 0.75, 0.14, 1), emission_strength=2.0)
    arc_bad = new_material("ArcBad", (0.98, 0.44, 0.52, 1),
                           emission_color=(0.98, 0.44, 0.52, 1), emission_strength=2.0)
    needle_mat = new_material("Needle", (0.9, 0.92, 0.95, 1), metallic=0.7, roughness=0.3)

    bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=0.16, location=(0, 0, 0.1), vertices=48,
                                        rotation=(math.pi / 2, 0, 0))
    face = smooth(bpy.context.active_object)
    face.name = "DialFace"
    face.data.materials.append(dial_mat)

    # Tick spheres around the top arc, coloured by band
    arc_colors = [arc_bad, arc_bad, arc_warn, arc_warn, arc_good, arc_good, arc_good]
    for i in range(7):
        ang = math.radians(200 - i * 33.5)  # sweep from left (bad) to right (good)
        x, z = 0.78 * math.cos(ang), 0.78 * math.sin(ang)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.055, segments=12, ring_count=8,
                                             location=(x, 0.12, z))
        tick = bpy.context.active_object
        tick.name = f"Tick_{i}"
        tick.data.materials.append(arc_colors[i])

    bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.85, location=(0, 0.05, 0.35),
                                    rotation=(0, math.radians(18), 0), vertices=16)
    needle = bpy.context.active_object
    needle.name = "Needle"
    needle.data.materials.append(needle_mat)
    # Needle sweeps between two values and returns (loop)
    needle.keyframe_insert(data_path="rotation_euler", frame=1, index=1)
    needle.rotation_euler[1] = math.radians(52)
    needle.keyframe_insert(data_path="rotation_euler", frame=120, index=1)
    needle.rotation_euler[1] = math.radians(-24)
    needle.keyframe_insert(data_path="rotation_euler", frame=240, index=1)
    make_linear(needle)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.22, location=(0, 0.05, 0.35),
                                        rotation=(math.pi / 2, 0, 0), vertices=24)
    hub = smooth(bpy.context.active_object)
    hub.name = "Hub"
    hub.data.materials.append(needle_mat)
    return {"data-node": needle}


BUILDERS = {
    "facility-globe": build_facility_globe,
    "air-quality-viz": build_air_quality_viz,
    "energy-flow": build_energy_flow,
    "waste-station": build_waste_station,
    "water-tank": build_water_tank,
    "traffic-flow": build_traffic_flow,
    "asset-tracker": build_asset_tracker,
    "safety-beacon": build_safety_beacon,
    "sustainability-meter": build_sustainability_meter,
}

# ------------------------------------------------------------------- export --

def export_glb(path):
    """Export scene as plain GLB.

    Deliberately NO Draco: compressed models force the browser to fetch a wasm
    decoder from a CDN, which breaks fully-offline demos and strict CSP. The
    meshes are low-poly enough that plain GLB stays within every size budget.
    """
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_animations=True,
    )


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="public/models")
    parser.add_argument("--only", default=None, help="comma-separated model ids")
    args = parser.parse_args(argv)

    out_dir = os.path.abspath(args.out)
    os.makedirs(out_dir, exist_ok=True)

    only = set(args.only.split(",")) if args.only else None
    exported = []

    for name, builder in BUILDERS.items():
        if only and name not in only:
            continue
        reset_scene()
        builder()
        bpy.context.scene.frame_end = 240
        path = os.path.join(out_dir, f"{name}.glb")
        export_glb(path)
        size_kb = os.path.getsize(path) / 1024
        exported.append((name, size_kb))
        print(f"[blender-export] {name}.glb  {size_kb:.0f} KB")

    total = sum(s for _, s in exported)
    print(f"[blender-export] done: {len(exported)} models, {total / 1024:.1f} MB total")


if __name__ == "__main__":
    main()
