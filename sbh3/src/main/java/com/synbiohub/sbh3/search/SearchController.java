package com.synbiohub.sbh3.search;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/search")
public class SearchController {

    @GetMapping(value = "/{keyword}")
    @ResponseBody
    public String getResults(@PathVariable("keyword") String keyword) {
        return "Search keyword: " + keyword;
    }
}
