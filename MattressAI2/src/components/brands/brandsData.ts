interface MattressModel {
  id: string;
  name: string;
  selected: boolean;
}

interface MattressSeries {
  name: string;
  models: MattressModel[];
}

interface Brand {
  id: string;
  name: string;
  series: MattressSeries[];
}

export const initialBrands: Brand[] = [
  {
    id: 'sealy',
    name: 'Sealy',
    series: [
      {
        name: 'Innerspring: Response Line',
        models: [
          { id: 'sealy-response-1', name: 'Response Essential', selected: false },
          { id: 'sealy-response-2', name: 'Response Performance', selected: false },
          { id: 'sealy-response-3', name: 'Response Premium', selected: false },
        ]
      },
      {
        name: 'Memory Foam: Conform Line',
        models: [
          { id: 'sealy-conform-1', name: 'Conform Essential', selected: false },
          { id: 'sealy-conform-2', name: 'Conform Performance', selected: false },
          { id: 'sealy-conform-3', name: 'Conform Premium', selected: false },
        ]
      },
      {
        name: 'Hybrid Line',
        models: [
          { id: 'sealy-hybrid-1', name: 'Hybrid Essential', selected: false },
          { id: 'sealy-hybrid-2', name: 'Hybrid Performance', selected: false },
          { id: 'sealy-hybrid-3', name: 'Hybrid Premium', selected: false },
        ]
      }
    ]
  },
  {
    id: 'serta',
    name: 'Serta',
    series: [
      {
        name: 'Innerspring',
        models: [
          { id: 'serta-perfect-1', name: 'Perfect Sleeper', selected: false },
          { id: 'serta-icomfort-h-1', name: 'iComfort Hybrid', selected: false },
        ]
      },
      {
        name: 'Memory Foam',
        models: [
          { id: 'serta-icomfort-1', name: 'iComfort Foam', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'serta-iseries-1', name: 'iSeries Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'tempurpedic',
    name: 'Tempur-Pedic',
    series: [
      {
        name: 'Memory Foam',
        models: [
          { id: 'tempur-adapt', name: 'TEMPUR-Adapt', selected: false },
          { id: 'tempur-proadapt', name: 'TEMPUR-ProAdapt', selected: false },
          { id: 'tempur-luxeadapt', name: 'TEMPUR-LuxeAdapt', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'tempur-adapt-h', name: 'TEMPUR-Adapt Hybrid', selected: false },
          { id: 'tempur-proadapt-h', name: 'TEMPUR-ProAdapt Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'simmons',
    name: 'Simmons',
    series: [
      {
        name: 'Innerspring',
        models: [
          { id: 'simmons-silver', name: 'Beautyrest Silver', selected: false },
          { id: 'simmons-platinum', name: 'Beautyrest Platinum', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'simmons-hybrid', name: 'Beautyrest Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'stearns',
    name: 'Stearns & Foster',
    series: [
      {
        name: 'Innerspring',
        models: [
          { id: 'stearns-estate', name: 'Estate', selected: false },
          { id: 'stearns-lux-estate', name: 'Lux Estate', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'stearns-lux-hybrid', name: 'Lux Estate Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'purple',
    name: 'Purple',
    series: [
      {
        name: 'Foam',
        models: [
          { id: 'purple-original', name: 'The Purple Mattress', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'purple-hybrid', name: 'Purple Hybrid', selected: false },
          { id: 'purple-hybrid-premier', name: 'Purple Hybrid Premier', selected: false },
        ]
      }
    ]
  },
  {
    id: 'casper',
    name: 'Casper',
    series: [
      {
        name: 'Foam',
        models: [
          { id: 'casper-original', name: 'Casper Original', selected: false },
          { id: 'casper-element', name: 'Casper Element', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'casper-hybrid', name: 'Casper Original Hybrid', selected: false },
          { id: 'casper-nova', name: 'Casper Nova Hybrid', selected: false },
          { id: 'casper-wave', name: 'Casper Wave Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'nectar',
    name: 'Nectar',
    series: [
      {
        name: 'Memory Foam',
        models: [
          { id: 'nectar-memory', name: 'Nectar Memory Foam Mattress', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'nectar-hybrid', name: 'Nectar Hybrid Mattress', selected: false },
        ]
      }
    ]
  },
  {
    id: 'tuft',
    name: 'Tuft & Needle',
    series: [
      {
        name: 'Foam',
        models: [
          { id: 'tuft-original', name: 'T&N Original', selected: false },
          { id: 'tuft-mint', name: 'T&N Mint', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'tuft-hybrid', name: 'T&N Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'leesa',
    name: 'Leesa',
    series: [
      {
        name: 'Foam',
        models: [
          { id: 'leesa-original', name: 'Leesa Original', selected: false },
          { id: 'leesa-studio', name: 'Leesa Studio', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'leesa-hybrid', name: 'Leesa Hybrid', selected: false },
          { id: 'leesa-legend', name: 'Leesa Legend', selected: false },
        ]
      }
    ]
  },
  {
    id: 'saatva',
    name: 'Saatva',
    series: [
      {
        name: 'Innerspring',
        models: [
          { id: 'saatva-classic', name: 'Saatva Classic', selected: false },
        ]
      },
      {
        name: 'Memory Foam',
        models: [
          { id: 'saatva-loom', name: 'Loom & Leaf', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'saatva-latex', name: 'Saatva Latex Hybrid', selected: false },
          { id: 'saatva-hd', name: 'Saatva HD', selected: false },
        ]
      }
    ]
  },
  {
    id: 'avocado',
    name: 'Avocado',
    series: [
      {
        name: 'Hybrid',
        models: [
          { id: 'avocado-green', name: 'Avocado Green Mattress', selected: false },
          { id: 'avocado-vegan', name: 'Avocado Vegan Mattress', selected: false },
        ]
      }
    ]
  },
  {
    id: 'helix',
    name: 'Helix',
    series: [
      {
        name: 'Hybrid',
        models: [
          { id: 'helix-sunset', name: 'Helix Sunset', selected: false },
          { id: 'helix-moonlight', name: 'Helix Moonlight', selected: false },
          { id: 'helix-midnight', name: 'Helix Midnight', selected: false },
          { id: 'helix-dusk', name: 'Helix Dusk', selected: false },
          { id: 'helix-twilight', name: 'Helix Twilight', selected: false },
          { id: 'helix-dawn', name: 'Helix Dawn', selected: false },
        ]
      },
      {
        name: 'Luxe',
        models: [
          { id: 'helix-sunset-luxe', name: 'Helix Sunset Luxe', selected: false },
          { id: 'helix-moonlight-luxe', name: 'Helix Moonlight Luxe', selected: false },
          { id: 'helix-midnight-luxe', name: 'Helix Midnight Luxe', selected: false },
          { id: 'helix-dusk-luxe', name: 'Helix Dusk Luxe', selected: false },
          { id: 'helix-twilight-luxe', name: 'Helix Twilight Luxe', selected: false },
          { id: 'helix-dawn-luxe', name: 'Helix Dawn Luxe', selected: false },
        ]
      }
    ]
  },
  {
    id: 'amerisleep',
    name: 'Amerisleep',
    series: [
      {
        name: 'Memory Foam',
        models: [
          { id: 'amerisleep-as1', name: 'AS1', selected: false },
          { id: 'amerisleep-as2', name: 'AS2', selected: false },
          { id: 'amerisleep-as3', name: 'AS3', selected: false },
          { id: 'amerisleep-as4', name: 'AS4', selected: false },
          { id: 'amerisleep-as5', name: 'AS5', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'amerisleep-as2h', name: 'AS2 Hybrid', selected: false },
          { id: 'amerisleep-as3h', name: 'AS3 Hybrid', selected: false },
          { id: 'amerisleep-as5h', name: 'AS5 Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'brooklyn',
    name: 'Brooklyn Bedding',
    series: [
      {
        name: 'Foam',
        models: [
          { id: 'brooklyn-chill', name: 'Brooklyn Chill', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'brooklyn-signature', name: 'Brooklyn Signature Hybrid', selected: false },
          { id: 'brooklyn-aurora', name: 'Brooklyn Aurora Hybrid', selected: false },
          { id: 'brooklyn-spartan', name: 'Brooklyn Spartan Hybrid', selected: false },
          { id: 'brooklyn-bloom', name: 'Brooklyn Bloom Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'bear',
    name: 'Bear Mattress',
    series: [
      {
        name: 'Foam',
        models: [
          { id: 'bear-original', name: 'Bear Original', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'bear-hybrid', name: 'Bear Hybrid', selected: false },
          { id: 'bear-pro', name: 'Bear Pro', selected: false },
        ]
      }
    ]
  },
  {
    id: 'winkbeds',
    name: 'WinkBeds',
    series: [
      {
        name: 'Hybrid',
        models: [
          { id: 'winkbed', name: 'WinkBed', selected: false },
          { id: 'winkbed-plus', name: 'WinkBed Plus', selected: false },
          { id: 'winkbed-ecocloud', name: 'EcoCloud Hybrid', selected: false },
        ]
      }
    ]
  },
  {
    id: 'nolah',
    name: 'Nolah',
    series: [
      {
        name: 'Foam',
        models: [
          { id: 'nolah-original', name: 'Nolah Original 10"', selected: false },
          { id: 'nolah-signature', name: 'Nolah Signature 12"', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'nolah-evolution', name: 'Nolah Evolution 15"', selected: false },
        ]
      }
    ]
  },
  {
    id: 'dreamcloud',
    name: 'DreamCloud',
    series: [
      {
        name: 'Hybrid',
        models: [
          { id: 'dreamcloud-luxury', name: 'DreamCloud Luxury Hybrid', selected: false },
          { id: 'dreamcloud-premier', name: 'DreamCloud Premier', selected: false },
          { id: 'dreamcloud-premier-rest', name: 'DreamCloud Premier Rest', selected: false },
        ]
      }
    ]
  },
  {
    id: 'puffy',
    name: 'Puffy',
    series: [
      {
        name: 'Foam',
        models: [
          { id: 'puffy-mattress', name: 'Puffy Mattress', selected: false },
          { id: 'puffy-lux', name: 'Puffy Lux', selected: false },
        ]
      },
      {
        name: 'Hybrid',
        models: [
          { id: 'puffy-royal-hybrid', name: 'Puffy Royal Hybrid', selected: false },
        ]
      }
    ]
  }
]; 