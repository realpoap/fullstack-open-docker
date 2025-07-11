async function scroll(page) {
    return await page.evaluate(async () => {
        return await new Promise((resolve, reject) => {
            var i = setInterval(() => {
                window.scrollBy(0, window.innerHeight);
                if (
                    document.scrollingElement.scrollTop + window.innerHeight >=
                    document.scrollingElement.scrollHeight
                ) {
                    window.scrollTo(0, 0);
                    clearInterval(i);
                    resolve();
                }
            }, 100);
        });
    });
}

export { scroll }