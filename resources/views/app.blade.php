<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Md Tanvir Hossain | eCommerce Architect & Automation Specialist') }}</title>

        <!-- Dynamic Integration & SEO Header Scripts -->
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-black text-white selection:bg-red-500/30 selection:text-white">
        @inertia
    </body>
</html>
