(() => {
    const container = document.getElementById("tree-container");
    const message = document.getElementById("tree-message");
    const search = document.getElementById("member-search");
    const clear = document.getElementById("clear-search");
    const panel = document.getElementById("search-panel");
    const results = document.getElementById("search-results");
    const searchStatus = document.getElementById("search-status");
    const zoomIn = document.getElementById("zoom-in");
    const zoomOut = document.getElementById("zoom-out");
    const fitButton = document.getElementById("fit-tree");
    const resetButton = document.getElementById("reset-view");
    const retry = document.getElementById("retry-load");
    const cardWidth = 248;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    retry.addEventListener("click", () => window.location.reload());

    function showError(error) {
        console.error("Family tree could not be loaded:", error);
        container.setAttribute("aria-busy", "false");
        message.hidden = false;
        message.classList.add("is-error");
        message.setAttribute("role", "alert");
        document.getElementById("message-text").textContent =
            "குடும்ப மரத்தை ஏற்ற முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும். இந்தப் பக்கத்தை HTTP சேவையகம் வழியாகத் திறக்கவும்.";
        retry.hidden = false;
    }

    function validateFamily(data) {
        const pending = [data];
        const ids = new Set();
        while (pending.length) {
            const person = pending.pop();
            if (!person || typeof person !== "object" || Array.isArray(person) ||
                typeof person.Name !== "string" || !person.Name.trim() ||
                (person.children !== undefined && !Array.isArray(person.children))) {
                throw new Error("Invalid family data: expected Name and an optional children array.");
            }
            if (typeof person.Id !== "string" || !/^[A-Za-z0-9_-]+$/.test(person.Id) || ids.has(person.Id)) {
                throw new Error("Invalid family data: Id must be unique and contain letters, digits, underscores or hyphens.");
            }
            ids.add(person.Id);
            for (const field of ["Aliases", "Sources"]) {
                if (!Array.isArray(person[field]) || person[field].some(value =>
                    typeof value !== "string" || !value.trim())) {
                    throw new Error(`Invalid family data: ${field} must be an array of nonempty strings.`);
                }
            }
            validateNullableText(person.Notes, "Notes");
            if (![null, "Male", "Female", "Other"].includes(person.Gender)) {
                throw new Error("Invalid family data: unsupported Gender.");
            }
            for (const field of ["Birth", "Death"]) {
                const event = person[field];
                if (!event || typeof event !== "object" || Array.isArray(event) ||
                    (event.Date !== null && !isValidDate(event.Date)) ||
                    (event.IsApproximate !== null && typeof event.IsApproximate !== "boolean") ||
                    (event.Date === null && event.IsApproximate !== null)) {
                    throw new Error(`Invalid family data: invalid ${field} date or approximation status.`);
                }
                validateNullableText(event.Place, `${field}.Place`);
            }
            const burial = person.Burial;
            if (!burial || typeof burial !== "object" || Array.isArray(burial) ||
                (burial.GraveFound !== null && typeof burial.GraveFound !== "boolean")) {
                throw new Error("Invalid family data: Burial.GraveFound must be boolean or null.");
            }
            validateNullableText(burial.CemeteryName, "Burial.CemeteryName");
            validateNullableText(burial.Location, "Burial.Location");
            if (person.Spouse !== null) {
                if (!person.Spouse || typeof person.Spouse !== "object" || Array.isArray(person.Spouse) ||
                    Object.hasOwn(person.Spouse, "children") || person.Spouse.Spouse !== null) {
                    throw new Error("Invalid family data: Spouse must be a person with Spouse null and no children.");
                }
                pending.push(person.Spouse);
            }
            pending.push(...(person.children || []));
        }
    }

    function validateNullableText(value, field) {
        if (value !== null && (typeof value !== "string" || !value.trim())) {
            throw new Error(`Invalid family data: ${field} must be a nonempty string or null.`);
        }
    }

    function isValidDate(value) {
        if (typeof value !== "string" || !/^\d{4}(?:-\d{2}-\d{2})?$/.test(value)) return false;
        const [year, month, day] = value.split("-").map(Number);
        if (year < 1) return false;
        if (value.length === 4) return true;
        if (month < 1 || month > 12) return false;
        const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return day >= 1 && day <= days[month - 1];
    }

    function formatRecord(person) {
        const details = [];
        if (person.Aliases.length) details.push(`மாற்றுப் பெயர்கள்: ${person.Aliases.join(", ")}`);
        if (person.Gender !== null) {
            const labels = { Male: "ஆண்", Female: "பெண்", Other: "மற்றவை" };
            details.push(`பாலினம்: ${labels[person.Gender]}`);
        }
        for (const [field, yearLabel, dateLabel, placeLabel] of [
            ["Birth", "பிறந்த ஆண்டு", "பிறந்த தேதி", "பிறந்த இடம்"],
            ["Death", "இறந்த ஆண்டு", "இறந்த தேதி", "இறந்த இடம்"]
        ]) {
            const event = person[field];
            if (event.Date !== null) {
                details.push(`${event.Date.length === 4 ? yearLabel : dateLabel}: ${event.Date}${event.IsApproximate === true ? " (சுமார்)" : ""}`);
            }
            if (event.Place !== null) details.push(`${placeLabel}: ${event.Place}`);
        }
        if (person.Burial.CemeteryName !== null) details.push(`கல்லறைத் தோட்டம்: ${person.Burial.CemeteryName}`);
        if (person.Burial.Location !== null) details.push(`கல்லறை இருப்பிடம்: ${person.Burial.Location}`);
        if (person.Burial.GraveFound !== null) {
            details.push(`கல்லறை கண்டறியப்பட்டது: ${person.Burial.GraveFound ? "ஆம்" : "இல்லை"}`);
        }
        if (person.Notes !== null) details.push(`குறிப்புகள்: ${person.Notes}`);
        if (person.Sources.length) details.push(`தகவல் ஆதாரங்கள்: ${person.Sources.join("; ")}`);
        if (person.Spouse !== null) {
            const spouse = formatRecord(person.Spouse);
            details.push(`வாழ்க்கைத் துணை: ${spouse.name}`);
            details.push(...spouse.details.map(detail => `வாழ்க்கைத் துணை · ${detail}`));
        }
        return { name: person.Name, details };
    }

    function searchNames(person) {
        return [person.Name, ...person.Aliases,
            ...(person.Spouse === null ? [] : [person.Spouse.Name, ...person.Spouse.Aliases])];
    }

    function addDetails(element, record) {
        record.details.forEach(detail => {
            const line = document.createElement("span");
            line.className = "member-detail";
            line.textContent = detail;
            element.append(line);
        });
    }

    function addCard(element, node) {
        const name = document.createElement("p");
        name.className = "member-name";
        name.textContent = node.display.name;
        element.append(name);
        addDetails(element, node.display);
        const generation = document.createElement("p");
        generation.className = "member-generation";
        generation.textContent = `தலைமுறை ${node.depth + 1}`;
        element.append(generation);
    }

    function render(data) {
        const root = d3.hierarchy(data);
        const members = root.descendants();
        members.forEach(node => {
            node.id = `member-${node.data.Id}`;
            node.display = formatRecord(node.data);
        });

        // Measure wrapped Tamil labels using the same styles as the rendered cards.
        const measure = document.createElement("div");
        measure.className = "family-node node-measure";
        document.body.append(measure);
        let cardHeight = 104;
        members.forEach(node => {
            measure.replaceChildren();
            addCard(measure, node);
            cardHeight = Math.max(cardHeight, Math.ceil(measure.getBoundingClientRect().height));
        });
        measure.remove();
        d3.tree().nodeSize([cardWidth + 36, cardHeight + 80])(root);

        const svg = d3.select("#family-tree");
        const scene = svg.append("g");
        scene.append("g").attr("aria-hidden", "true")
            .selectAll("path").data(root.links()).join("path")
            .attr("class", "tree-link")
            .attr("d", ({ source, target }) => {
                const start = source.y + cardHeight;
                const middle = (start + target.y) / 2;
                return `M${source.x},${start}V${middle}H${target.x}V${target.y}`;
            });
        const cards = scene.append("g").selectAll("g").data(members).join("g")
            .attr("class", node => `tree-node${node === root ? " is-root" : ""}`)
            .attr("id", node => node.id)
            .attr("role", "group")
            .attr("aria-label", node =>
                `${[node.display.name, ...node.display.details].join(" · ")} · தலைமுறை ${node.depth + 1}${node.parent ? ` · முந்தைய தலைமுறை: ${node.parent.display.name}` : ""}`)
            .attr("transform", node => `translate(${node.x - cardWidth / 2},${node.y})`);
        cards.append("foreignObject").attr("width", cardWidth).attr("height", cardHeight)
            .append("xhtml:div").attr("class", "family-node")
            .each(function (node) { addCard(this, node); });

        const bounds = {
            left: d3.min(members, node => node.x) - cardWidth / 2,
            right: d3.max(members, node => node.x) + cardWidth / 2,
            top: 0,
            bottom: d3.max(members, node => node.y) + cardHeight
        };
        let width = container.clientWidth;
        let height = container.clientHeight;
        let viewMode = "root";

        function fitScale() {
            return Math.min((width - 48) / (bounds.right - bounds.left),
                (height - 48) / (bounds.bottom - bounds.top), 1);
        }

        const zoom = d3.zoom().scaleExtent([Math.min(fitScale(), .2), 2.5])
            .on("zoom", event => {
                scene.attr("transform", event.transform);
                const scale = event.transform.k;
                document.getElementById("zoom-level").textContent = `${Math.round(scale * 100)}%`;
                zoomIn.disabled = scale >= zoom.scaleExtent()[1] - .001;
                zoomOut.disabled = scale <= zoom.scaleExtent()[0] + .001;
            });
        svg.call(zoom).on("dblclick.zoom", null);
        svg.on("wheel.mode touchstart.mode mousedown.mode", () => { viewMode = "custom"; });

        function moveTo(transform, animate = true) {
            svg.interrupt();
            if (animate && !reducedMotion.matches) {
                svg.transition().duration(250).call(zoom.transform, transform);
            } else {
                svg.call(zoom.transform, transform);
            }
        }

        function reset(animate = true) {
            viewMode = "root";
            moveTo(d3.zoomIdentity.translate(width / 2 - root.x, 36), animate);
        }

        function fit(animate = true) {
            viewMode = "fit";
            const scale = fitScale();
            moveTo(d3.zoomIdentity
                .translate(width / 2 - (bounds.left + bounds.right) / 2 * scale,
                    height / 2 - (bounds.top + bounds.bottom) / 2 * scale)
                .scale(scale), animate);
        }

        function changeZoom(factor) {
            viewMode = "custom";
            svg.interrupt();
            svg.call(zoom.scaleBy, factor);
        }

        zoomIn.addEventListener("click", () => changeZoom(1.25));
        zoomOut.addEventListener("click", () => changeZoom(.8));
        fitButton.addEventListener("click", () => fit());
        resetButton.addEventListener("click", () => reset());
        svg.on("keydown", event => {
            const direction = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] }[event.key];
            if (direction) {
                event.preventDefault();
                viewMode = "custom";
                svg.interrupt();
                const current = d3.zoomTransform(svg.node());
                moveTo(d3.zoomIdentity.translate(current.x + direction[0], current.y + direction[1]).scale(current.k), false);
            } else if (["+", "=", "-", "Home", "0"].includes(event.key)) {
                event.preventDefault();
                if (event.key === "Home") reset();
                else if (event.key === "0") fit();
                else changeZoom(event.key === "-" ? .8 : 1.25);
            }
        });

        function selectMember(node) {
            cards.classed("is-selected", member => member.id === node.id);
            viewMode = "custom";
            moveTo(d3.zoomIdentity.translate(width / 2 - node.x, height / 2 - node.y - cardHeight / 2));
            panel.hidden = true;
            svg.node().focus({ preventScroll: true });
        }

        function updateSearch() {
            const query = search.value.trim().normalize("NFC").toLocaleLowerCase("ta");
            const matches = query ? members.filter(node =>
                searchNames(node.data).some(name =>
                    name.normalize("NFC").toLocaleLowerCase("ta").includes(query))) : [];
            const matchIds = new Set(matches.map(node => node.id));
            cards.classed("is-match", node => matchIds.has(node.id)).classed("is-selected", false);
            clear.disabled = !search.value;
            panel.hidden = !query;
            results.replaceChildren();
            searchStatus.textContent = matches.length
                ? `${matches.length} முடிவுகள் · உறுப்பினரைத் தேர்ந்தெடுக்கவும்`
                : "பொருந்தும் பெயர்கள் இல்லை.";
            matches.forEach(node => {
                const item = document.createElement("li");
                const button = document.createElement("button");
                button.type = "button";
                button.className = "search-result";
                const name = document.createElement("span");
                name.textContent = node.display.name;
                const context = document.createElement("span");
                context.className = "result-context";
                context.textContent = `தலைமுறை ${node.depth + 1}${node.parent ? ` · ${node.parent.display.name}` : ""}`;
                button.append(name);
                addDetails(button, node.display);
                button.append(context);
                button.addEventListener("click", () => selectMember(node));
                item.append(button);
                results.append(item);
            });
        }

        search.addEventListener("input", updateSearch);
        search.addEventListener("focus", () => { panel.hidden = !search.value.trim(); });
        search.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                search.value = "";
                updateSearch();
            } else if (event.key === "Enter") {
                results.querySelector("button")?.click();
            }
        });
        clear.addEventListener("click", () => {
            search.value = "";
            updateSearch();
            search.focus();
        });

        new ResizeObserver(() => {
            const nextWidth = container.clientWidth;
            const nextHeight = container.clientHeight;
            if (nextWidth === width && nextHeight === height) return;
            svg.interrupt();
            const current = d3.zoomTransform(svg.node());
            const centerX = (width / 2 - current.x) / current.k;
            const centerY = (height / 2 - current.y) / current.k;
            width = nextWidth;
            height = nextHeight;
            zoom.scaleExtent([Math.min(fitScale(), .2), 2.5]);
            if (viewMode === "fit") fit(false);
            else {
                const scale = Math.max(zoom.scaleExtent()[0], Math.min(current.k, zoom.scaleExtent()[1]));
                moveTo(d3.zoomIdentity.translate(width / 2 - centerX * scale,
                    height / 2 - centerY * scale).scale(scale), false);
            }
        }).observe(container);

        search.disabled = false;
        fitButton.disabled = false;
        resetButton.disabled = false;
        document.getElementById("family-summary").textContent =
            `${members.length} குடும்பப் பதிவுகள் · ${root.height + 1} தலைமுறைகள்`;
        container.setAttribute("aria-busy", "false");
        message.hidden = true;
        reset(false);
    }

    async function load() {
        try {
            if (typeof window.d3 === "undefined") {
                throw new Error("D3 did not load. Check the CDN connection.");
            }
            const response = await fetch("family.json");
            if (!response.ok) throw new Error(`family.json: HTTP ${response.status}`);
            const data = await response.json();
            validateFamily(data);
            render(data);
        } catch (error) {
            showError(error);
        }
    }

    load();
})();
