tailwind.config={
  theme:{
      extend:{
      gridTemplateColumns:{
          'auto':'repeat(auto-fit, minmax(200px,1fr))'
      },fontFamily:{
          Outfit:["Outfit","sans-serif"],
          Ovo:["Ovo","serif"]



      } ,
      
animation:
  {
              spin_slow:'spin 6s linear infinite'
  },
colors:{
  lighthover:'#fcf4ff',
  darkhover:'#2a004a',
  darkTheme:'#11001F'
},
boxShadow:{
  black:'4px_4px_0_#000',
  white:'4px_4px_0_#fff',
  blue:' #0000FF',
}
      
  }},
  darkMode:'selector'
}