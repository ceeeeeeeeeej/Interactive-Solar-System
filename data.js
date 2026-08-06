// js/data.js — Planet encyclopedia, missions, quiz data

export const PLANET_DATA = {
  sun: {
    name: 'The Sun',
    icon: '☀',
    type: 'G-type Main Sequence Star',
    color: '#ffcc00',
    diameter: '1,392,700 km',
    gravity: '274 m/s²',
    distance: '— (Center of Solar System)',
    dayLength: '25 Earth days (equator)',
    yearLength: '225–250 million years (galactic)',
    moons: '—',
    temperature: '5,500°C (surface) / 15M°C (core)',
    atmosphere: 'Hydrogen (73%), Helium (25%), traces of O, C, Ne',
    description:
      'The Sun is the star at the center of our Solar System. It is a nearly perfect sphere of hot plasma, heated by nuclear fusion reactions in its core that convert hydrogen into helium, releasing enormous energy. It accounts for 99.86% of the total mass of the Solar System.',
    funFact:
      'Light from the Sun takes 8 minutes and 20 seconds to reach Earth. The energy produced by the Sun in one second is greater than all the energy humans have ever consumed in history.',
    missions: ['Parker Solar Probe', 'Solar Orbiter', 'SOHO']
  },
  mercury: {
    name: 'Mercury',
    icon: '⚫',
    type: 'Terrestrial Planet',
    color: '#9e9e9e',
    diameter: '4,879 km',
    gravity: '3.7 m/s²',
    distance: '57.9 million km',
    dayLength: '59 Earth days',
    yearLength: '88 Earth days',
    moons: '0',
    temperature: '-180°C to 430°C',
    atmosphere: 'Virtually none (thin exosphere of O, Na, H)',
    description:
      'Mercury is the smallest planet in the Solar System and the closest to the Sun. Its surface is heavily cratered, resembling our Moon. It has no moons and no rings. Despite being closest to the Sun, it is not the hottest planet.',
    funFact:
      'A day on Mercury (sunrise to sunrise) lasts 176 Earth days — longer than its year of 88 days! Mercury has water ice in permanently shadowed craters at its poles.',
    missions: ['Mariner 10', 'MESSENGER', 'BepiColombo (en route)']
  },
  venus: {
    name: 'Venus',
    icon: '🌕',
    type: 'Terrestrial Planet',
    color: '#e8cda0',
    diameter: '12,104 km',
    gravity: '8.87 m/s²',
    distance: '108.2 million km',
    dayLength: '243 Earth days',
    yearLength: '225 Earth days',
    moons: '0',
    temperature: '465°C (average)',
    atmosphere: 'CO₂ (96%), N₂ (3.5%), clouds of H₂SO₄',
    description:
      'Venus is the second planet from the Sun and the hottest planet in the Solar System due to its runaway greenhouse effect. It rotates in the opposite direction to most planets — the Sun rises in the west on Venus.',
    funFact:
      'Venus rotates so slowly that its day is longer than its year. The atmospheric pressure on Venus is 90 times that of Earth — equivalent to being 900m underwater.',
    missions: ['Venera program', 'Magellan', 'Venus Express', 'DAVINCI+ (planned)']
  },
  earth: {
    name: 'Earth',
    icon: '🌍',
    type: 'Terrestrial Planet',
    color: '#4a90d9',
    diameter: '12,742 km',
    gravity: '9.81 m/s²',
    distance: '149.6 million km (1 AU)',
    dayLength: '24 hours',
    yearLength: '365.25 days',
    moons: '1 (The Moon)',
    temperature: '15°C (average)',
    atmosphere: 'N₂ (78%), O₂ (21%), Ar (0.9%), CO₂ (0.04%)',
    description:
      'Earth is the third planet from the Sun and the only known astronomical object to harbor life. Its unique position in the habitable zone, liquid water, protective magnetic field, and oxygen-rich atmosphere make it perfect for life. 70% of the surface is covered by oceans.',
    funFact:
      '70% of Earth\'s surface is covered by water. Earth is the densest planet in the Solar System. Our Moon is the largest natural satellite relative to its host planet in the solar system.',
    missions: ['ISS', 'Hubble Space Telescope', 'GOES weather satellites']
  },
  mars: {
    name: 'Mars',
    icon: '🔴',
    type: 'Terrestrial Planet',
    color: '#c1440e',
    diameter: '6,779 km',
    gravity: '3.72 m/s²',
    distance: '227.9 million km',
    dayLength: '24.6 hours',
    yearLength: '687 Earth days',
    moons: '2 (Phobos, Deimos)',
    temperature: '-60°C (average)',
    atmosphere: 'CO₂ (95.3%), N₂ (2.7%), Ar (1.6%)',
    description:
      'Mars is the fourth planet from the Sun and the second-smallest planet. Known as the Red Planet due to iron oxide on its surface. It has the tallest volcano (Olympus Mons) and the longest canyon system (Valles Marineris) in the Solar System.',
    funFact:
      'Olympus Mons on Mars is 21 km tall — nearly 3× the height of Mount Everest. Mars has the largest dust storms in the solar system, which can engulf the entire planet for months.',
    missions: ['Perseverance', 'Curiosity', 'InSight', 'Mars Odyssey', 'MRO']
  },
  jupiter: {
    name: 'Jupiter',
    icon: '🟠',
    type: 'Gas Giant',
    color: '#c88b3a',
    diameter: '139,820 km',
    gravity: '24.79 m/s²',
    distance: '778.5 million km',
    dayLength: '9.9 hours',
    yearLength: '11.9 Earth years',
    moons: '95 (inc. Io, Europa, Ganymede, Callisto)',
    temperature: '-110°C (cloud tops)',
    atmosphere: 'H₂ (90%), He (10%), traces of methane, ammonia',
    description:
      'Jupiter is the largest planet in the Solar System — more than twice the mass of all other planets combined. The Great Red Spot is a storm larger than Earth that has been raging for at least 400 years. Jupiter acts as the solar system\'s "vacuum cleaner," attracting many asteroids.',
    funFact:
      'Jupiter\'s moon Europa has a subsurface ocean that may contain twice as much water as all of Earth\'s oceans combined. The Great Red Spot storm is shrinking — it was once 3× Earth\'s size.',
    missions: ['Pioneer 10 & 11', 'Voyager 1 & 2', 'Galileo', 'Juno'],
    embed: `<iframe title="Jupiter" frameborder="0" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share width="640" height="480" src="https://sketchfab.com/models/c09a1970148c43ad99db134a9d6d00b5/embed"></iframe><p style="font-size: 12px; font-weight: normal; margin: 6px 0 0; color: #a8b8d8;"><a href="https://sketchfab.com/3d-models/saturn-c09a1970148c43ad99db134a9d6d00b5" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Jupiter 3D Model</a> by <a href="https://sketchfab.com/Nestaeric" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Nestaeric</a> on <a href="https://sketchfab.com" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Sketchfab</a></p>`
  },
  saturn: {
    name: 'Saturn',
    icon: '🪐',
    type: 'Gas Giant',
    color: '#e4d191',
    diameter: '116,460 km',
    gravity: '10.44 m/s²',
    distance: '1.43 billion km',
    dayLength: '10.7 hours',
    yearLength: '29.5 Earth years',
    moons: '146 (inc. Titan, Enceladus)',
    temperature: '-140°C (cloud tops)',
    atmosphere: 'H₂ (96%), He (3%), traces of methane',
    description:
      'Saturn is the sixth planet and is famous for its spectacular ring system — the largest and most visible in the Solar System. Its rings are made of ice and rock ranging from tiny grains to chunks as big as houses. Saturn is the least dense planet — it would float on water.',
    funFact:
      'Saturn\'s moon Titan has lakes and rivers of liquid methane. Enceladus shoots geysers of water vapor from its south pole, suggesting a subsurface ocean. Saturn\'s rings are only 10–100 meters thick despite being 274,000 km wide.',
    missions: ['Pioneer 11', 'Voyager 1 & 2', 'Cassini-Huygens'],
    embed: `<iframe title="Saturn" frameborder="0" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share width="640" height="480" src="https://sketchfab.com/models/c09a1970148c43ad99db134a9d6d00b5/embed"></iframe><p style="font-size: 12px; font-weight: normal; margin: 6px 0 0; color: #a8b8d8;"><a href="https://sketchfab.com/3d-models/saturn-c09a1970148c43ad99db134a9d6d00b5" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Saturn</a> by <a href="https://sketchfab.com/Nestaeric" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Nestaeric</a> on <a href="https://sketchfab.com" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Sketchfab</a></p>`
  },
  uranus: {
    name: 'Uranus',
    icon: '🔵',
    type: 'Ice Giant',
    color: '#7de8e8',
    diameter: '50,724 km',
    gravity: '8.69 m/s²',
    distance: '2.87 billion km',
    dayLength: '17.2 hours',
    yearLength: '84 Earth years',
    moons: '28 (inc. Miranda, Ariel, Titania)',
    temperature: '-197°C (average)',
    atmosphere: 'H₂ (83%), He (15%), methane (2.3%)',
    description:
      'Uranus is the seventh planet and an ice giant. It is unique in that it rotates on its side — its axis is tilted at 97.77°, meaning it essentially rolls around the Sun like a ball. This extreme tilt causes seasons that last 21 years.',
    funFact:
      'Uranus rotates on its side — thought to be caused by a massive collision long ago. It has the coldest planetary atmosphere in the solar system at -224°C, despite not being the furthest from the Sun.',
    missions: ['Voyager 2 (only spacecraft to visit)']
  },
  neptune: {
    name: 'Neptune',
    icon: '🌀',
    type: 'Ice Giant',
    color: '#3d56b2',
    diameter: '49,244 km',
    gravity: '11.15 m/s²',
    distance: '4.5 billion km',
    dayLength: '16.1 hours',
    yearLength: '165 Earth years',
    moons: '16 (inc. Triton)',
    temperature: '-201°C (average)',
    atmosphere: 'H₂ (80%), He (19%), methane (1.5%)',
    description:
      'Neptune is the eighth and farthest known planet from the Sun. It is the windiest planet, with storms reaching 2,100 km/h. The planet was mathematically predicted before it was directly observed — its existence was inferred from gravitational perturbations of Uranus.',
    funFact:
      'Neptune\'s moon Triton orbits in the opposite direction to the planet\'s rotation (retrograde orbit) and is likely a captured Kuiper Belt object. Neptune takes 165 Earth years to orbit the Sun — it completed its first full orbit since discovery in 2011.',
    missions: ['Voyager 2 (1989, only visit)', 'Trident (proposed)'],
    embed: `<iframe title="Neptune" frameborder="0" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share width="640" height="480" src="https://sketchfab.com/models/2a6f9ccc5c724a709912774caa197b77/embed"></iframe><p style="font-size: 12px; font-weight: normal; margin: 6px 0 0; color: #a8b8d8;"><a href="https://sketchfab.com/3d-models/neptune-2a6f9ccc5c724a709912774caa197b77" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Neptune 3D Model</a> by <a href="https://sketchfab.com/Nestaeric" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Nestaeric</a> on <a href="https://sketchfab.com" target="_blank" rel="nofollow" style="font-weight: bold; color: #00d4ff;">Sketchfab</a></p>`
  },
  moon: {
    name: 'The Moon',
    icon: '🌙',
    type: 'Natural Satellite',
    color: '#b8b8b8',
    diameter: '3,474 km',
    gravity: '1.62 m/s²',
    distance: '384,400 km from Earth',
    dayLength: '29.5 Earth days',
    yearLength: '27.3 days (orbital period)',
    moons: '0',
    temperature: '-173°C to 127°C',
    atmosphere: 'Virtually none (thin exosphere)',
    description:
      'The Moon is Earth\'s only natural satellite and the fifth largest moon in the Solar System. It is tidally locked to Earth, meaning we always see the same face. The Moon stabilizes Earth\'s axial tilt, making our climate stable and life possible.',
    funFact:
      'The Moon is slowly drifting away from Earth at about 3.8 cm per year. It was formed approximately 4.5 billion years ago from debris after a Mars-sized body (Theia) collided with the early Earth.',
    missions: ['Apollo 11–17', 'Luna program', 'Artemis (ongoing)', 'Chang\'e program']
  }
};

export const MISSIONS_DATA = [
  {
    name: 'Parker Solar Probe',
    agency: 'NASA',
    icon: '☀',
    status: 'active',
    target: 'Sun',
    launched: '2018',
    description: 'Orbiting closer to the Sun than any previous spacecraft, studying the corona and solar wind. Has achieved record-breaking speeds of 690,000 km/h.'
  },
  {
    name: 'James Webb Space Telescope',
    agency: 'NASA / ESA / CSA',
    icon: '🔭',
    status: 'active',
    target: 'Deep Space',
    launched: '2021',
    description: 'The most powerful space telescope ever built, observing the universe in infrared from a point 1.5 million km from Earth at L2.'
  },
  {
    name: 'Perseverance Rover',
    agency: 'NASA',
    icon: '🔴',
    status: 'active',
    target: 'Mars',
    launched: '2020',
    description: 'Exploring Jezero Crater for signs of ancient microbial life. Successfully produced oxygen from the Martian atmosphere and deployed the Ingenuity helicopter.'
  },
  {
    name: 'Juno',
    agency: 'NASA',
    icon: '🟠',
    status: 'active',
    target: 'Jupiter',
    launched: '2011',
    description: 'Orbiting Jupiter to study its composition, gravity field, magnetic field, and polar magnetosphere. Has revealed stunning close-up images of Jupiter\'s cloud tops.'
  },
  {
    name: 'Voyager 1',
    agency: 'NASA',
    icon: '🚀',
    status: 'active',
    target: 'Interstellar Space',
    launched: '1977',
    description: 'The farthest human-made object from Earth, now over 23 billion km away in interstellar space. Still transmitting data after 47 years of flight.'
  },
  {
    name: 'Voyager 2',
    agency: 'NASA',
    icon: '🚀',
    status: 'active',
    target: 'Interstellar Space',
    launched: '1977',
    description: 'The only spacecraft to have visited all four outer planets. Flew by Jupiter, Saturn, Uranus, and Neptune before entering interstellar space.'
  },
  {
    name: 'Cassini-Huygens',
    agency: 'NASA / ESA',
    icon: '🪐',
    status: 'completed',
    target: 'Saturn',
    launched: '1997',
    description: 'Orbited Saturn for 13 years, discovering geysers on Enceladus and deploying the Huygens probe to Titan\'s surface. Ended with a dramatic dive into Saturn in 2017.'
  },
  {
    name: 'BepiColombo',
    agency: 'ESA / JAXA',
    icon: '⚫',
    status: 'active',
    target: 'Mercury',
    launched: '2018',
    description: 'Joint European-Japanese mission to Mercury. Will study the planet\'s composition, geology, atmosphere, and magnetic field. Arrives at Mercury orbit in 2026.'
  },
  {
    name: 'Artemis Program',
    agency: 'NASA',
    icon: '🌙',
    status: 'active',
    target: 'Moon',
    launched: '2022',
    description: 'Returning humans to the Moon for the first time since Apollo 17 in 1972. Plans to establish a permanent lunar presence as a stepping stone to Mars.'
  },
  {
    name: 'Europa Clipper',
    agency: 'NASA',
    icon: '🟠',
    status: 'active',
    target: 'Europa (Jupiter moon)',
    launched: '2024',
    description: 'Will conduct 49 close flybys of Europa to investigate whether Jupiter\'s icy moon could harbor conditions suitable for life in its subsurface ocean.'
  },
  {
    name: 'Dragonfly',
    agency: 'NASA',
    icon: '🪐',
    status: 'planned',
    target: 'Titan (Saturn moon)',
    launched: '2028 (planned)',
    description: 'A rotorcraft lander that will fly to dozens of locations across Titan\'s surface, studying prebiotic chemistry and conditions that could support life.'
  }
];

export const QUIZ_DATA = [
  { q: 'Which planet has the most moons?', opts: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], a: 1 },
  { q: 'What is the hottest planet in the Solar System?', opts: ['Mercury', 'Mars', 'Venus', 'Jupiter'], a: 2 },
  { q: 'How long does light take to travel from the Sun to Earth?', opts: ['1 minute', '8 minutes', '1 hour', '1 day'], a: 1 },
  { q: 'Which planet has the Great Red Spot?', opts: ['Mars', 'Saturn', 'Neptune', 'Jupiter'], a: 3 },
  { q: 'Which planet rotates on its side (97° tilt)?', opts: ['Neptune', 'Uranus', 'Saturn', 'Venus'], a: 1 },
  { q: 'What is the largest planet in the Solar System?', opts: ['Saturn', 'Uranus', 'Jupiter', 'Neptune'], a: 2 },
  { q: 'Which planet is known as the Red Planet?', opts: ['Venus', 'Mars', 'Mercury', 'Jupiter'], a: 1 },
  { q: 'How many Earth years does Neptune take to orbit the Sun?', opts: ['12', '29', '84', '165'], a: 3 },
  { q: 'What percentage of the Solar System\'s mass does the Sun contain?', opts: ['75%', '90%', '99.86%', '50%'], a: 2 },
  { q: 'Which planet is the least dense — it would float on water?', opts: ['Uranus', 'Neptune', 'Saturn', 'Jupiter'], a: 2 },
];
