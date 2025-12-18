async function generateIcons() {
  try {
    console.log('Generando iconos PWA...');
    
    const { generateIcons } = await import('pwa-asset-generator');
    
    await generateIcons({
      source: './public/placeholder-logo.png',
      destination: './public/icons',
      iconOnly: true,
      manifest: './public/manifest.json',
      background: '#3B82F6',
      padding: '10%',
      log: true,
      pathOverride: '/icons',
      opaque: false,
      maskable: true,
      favicon: true,
      appleTouchIcon: true,
      appleTouchStartupImage: true,
      windowsTile: true,
      androidChrome: true,
      mstile: true,
      safariPinnedTab: true
    });
    
    console.log('✅ Iconos PWA generados exitosamente!');
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
  }
}

generateIcons();
