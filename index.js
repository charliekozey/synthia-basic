const keyboard = {
    "a": { freq: 262, down: false },
    "w": { freq: 277, down: false },
    "s": { freq: 294, down: false },
    "e": { freq: 311, down: false },
    "d": { freq: 330, down: false },
    "f": { freq: 349, down: false },
    "t": { freq: 370, down: false },
    "g": { freq: 392, down: false },
    "y": { freq: 415, down: false },
    "h": { freq: 440, down: false },
    "u": { freq: 466, down: false },
    "j": { freq: 494, down: false },
    "k": { freq: 523, down: false },
    "o": { freq: 554, down: false },
    "l": { freq: 587, down: false },
    "p": { freq: 622, down: false },
    ";": { freq: 659, down: false },
    "'": { freq: 698, down: false },
}
const starterPatch = {
    oscillators: [
        {
            number: 1,
            osc_type: "sine",
            gain: 0.5,
            attack: 0.5,
            decay: 0.5,
            sustain: 0.5,
            release: 0.5
        },
        {
            number: 2,
            osc_type: "sine",
            gain: 0.5,
            attack: 0.5,
            decay: 0.5,
            sustain: 0.5,
            release: 0.5
        },
        {
            number: 3,
            osc_type: "sine",
            gain: 0.5,
            attack: 0.5,
            decay: 0.5,
            sustain: 0.5,
            release: 0.5
        }
    ]
}
const audioContext = new AudioContext()
const oscillators = []
const nodes = []
let patchState = {}

function loadPatch(patch) {
    oscillators.length = 0

    patch.oscillators.forEach(osc => {
        const typeSelect = document.getElementById(`osc_type-select-${osc.number}`)
        const gainSlider = document.getElementById(`gain-slider-${osc.number}`)
        const attackSlider = document.getElementById(`attack-slider-${osc.number}`)
        const releaseSlider = document.getElementById(`release-slider-${osc.number}`)
        typeSelect.value = osc.osc_type
        gainSlider.value = osc.gain
        attackSlider.value = osc.attack
        releaseSlider.value = osc.release

        typeSelect.addEventListener("input", e => updateValue(e, osc))
        gainSlider.addEventListener("input", e => updateValue(e, osc))
        attackSlider.addEventListener("input", e => updateValue(e, osc))
        releaseSlider.addEventListener("input", e => updateValue(e, osc))

        oscillators.push(osc)

    })

    patchState = patch
}

function startSound(e) {
    if (e.repeat) return

    const input = e.key

    if (Object.keys(keyboard).includes(input) && !keyboard[input].down) {
        oscillators.forEach(osc => {
            const sampleRate = audioContext.sampleRate
            const duration = 1.0
            const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate)
            const channelData = buffer.getChannelData(0)
            const attackTime = parseFloat(logifyValue(osc.attack)) * 0.1
            const oscNode = new OscillatorNode(audioContext, { type: osc.osc_type, frequency: keyboard[input].freq })
            const gainNode = new GainNode(audioContext, { gain: parseFloat(osc.gain) })
            const newNode = {
                osc_node: oscNode,
                gain_node: gainNode,
                key_pressed: input,
                osc_data: osc
            }

            for (let i = 0; i < buffer.length; i++) {
                channelData[i] = Math.sin((i / sampleRate) * 2 * Math.PI * 440)
            }

            oscNode.buffer = buffer
            oscNode.connect(gainNode)
            gainNode.gain.setValueAtTime(0.0000000001, audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(parseFloat(osc.gain) * 0.1, audioContext.currentTime + attackTime)
            gainNode.connect(audioContext.destination)
            oscNode.start()

            nodes.push(newNode)
        })

        document.addEventListener("keyup", event => {
            if (event.key == input) {
                stopSound(event)
            }
        })

        keyboard[input].down = true
    }
}

function stopSound(e) {
    const input = e.key
  
        nodes.forEach(node => {
          const releaseTime = logifyValue(node.osc_data.release)
  
          if (node.key_pressed == input) {
            node.gain_node.gain.setValueAtTime(node.gain_node.gain.value, audioContext.currentTime)
            node.gain_node.gain.exponentialRampToValueAtTime(0.0000000001, audioContext.currentTime + parseFloat(releaseTime))
  
            setTimeout(() => {
              node.gain_node.disconnect()
              node.osc_node.disconnect()
            }, 5000)
          }
        })

        keyboard[input].down = false
}

function changeOctave(e) {
    for (const note in keyboard) {
        if (e.key == "z") {
            keyboard[note].freq = keyboard[note].freq / 2
        }
        if (e.key == "x") {
            keyboard[note].freq = keyboard[note].freq * 2
        }
    }
}

function panic(e) {
    if (e.key == "Escape") {
        nodes.forEach(node => {
            node.gain_node.gain.setValueAtTime(node.gain_node.gain.value, audioContext.currentTime)
            node.gain_node.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.002)

            setTimeout(() => {
                node.gain_node.disconnect()
                node.osc_node.disconnect()
            }, 51)
        })
    }
}

function updateValue(e, editedOsc) {
    const updatedValue = e.target.name === `osc_type-${editedOsc.number}` ?
        e.target.value
        :
        parseFloat(e.target.value)
    const slicedName = e.target.name.slice(0, -2)

    patchState.oscillators.forEach(osc => {
        if (parseFloat(osc.number) === editedOsc.number) {
            osc[slicedName] = updatedValue
        }
    })
}

function logifyValue(position) {
    const minInput = 0
    const maxInput = 100
    const minValue = Math.log(1)
    const maxValue = Math.log(100000000000000000000)
    const scale = (maxInput - minInput) / (maxValue - minValue)

    return Math.exp(minValue + scale * (position - minInput))
}

loadPatch(starterPatch)

document.addEventListener("keydown", e => startSound(e))
document.addEventListener("keydown", e => changeOctave(e))
document.addEventListener("keydown", e => panic(e))